import type { Clock } from '@/application/ports';
import {
  type Armazenamento,
  gravarItem,
  lerItem,
  obterLocalStorage,
  removerItem,
} from '@/infrastructure/storage/armazenamento';
import { clonar, ehRegistro } from '@/infrastructure/shared/registro';
import { criarSeed } from './seed';
import type { DadosMock } from './tipos';

/** A versão faz parte da chave: mudar o formato das tabelas → nova chave → nova semente. */
export const CHAVE_BANCO_MOCK = 'arena.mock-db.v1';
const VERSAO = 1;
const TABELAS = ['administradores', 'clientes', 'quadras', 'reservas', 'pagamentos'] as const;

export interface BancoMock {
  /**
   * Executa a operação sobre uma cópia das tabelas: se ela lançar erro nada é gravado
   * (atomicidade); se concluir, a cópia vira o novo estado. Devolve uma cópia do resultado.
   */
  transacao<T>(operacao: (dados: DadosMock) => T): T;
  /** Descarta os dados e recria a semente de demonstração relativa a hoje. */
  resetar(): void;
}

let bancoAtual: BancoMock | null = null;

/**
 * Banco simulado persistido no localStorage. Cada transação relê o armazenamento, então abas e
 * instâncias diferentes enxergam os mesmos dados. Se o storage falhar, segue apenas em memória.
 */
export function criarBancoMock(opcoes: { storage: Armazenamento | null; clock: Clock }): BancoMock {
  const { storage, clock } = opcoes;
  let somenteMemoria = storage === null;
  let bruto: string | null = null;
  let dados: DadosMock | null = null;

  function gravar(novos: DadosMock): void {
    dados = novos;
    const serializado = JSON.stringify({ versao: VERSAO, dados: novos });
    if (serializado === bruto) return;
    bruto = serializado;
    if (!somenteMemoria && !gravarItem(storage, CHAVE_BANCO_MOCK, serializado))
      somenteMemoria = true;
  }

  function carregar(): DadosMock {
    if (!somenteMemoria) {
      const armazenado = lerItem(storage, CHAVE_BANCO_MOCK);
      if (armazenado !== null && armazenado !== bruto) {
        const interpretado = interpretar(armazenado);
        if (interpretado) {
          bruto = armazenado;
          dados = interpretado;
        }
      }
    }
    if (dados) return dados;
    const semente = criarSeed(clock.now());
    gravar(semente);
    return semente;
  }

  const banco: BancoMock = {
    transacao: (operacao) => {
      const copia = clonar(carregar());
      const resultado = operacao(copia);
      gravar(copia);
      return clonar(resultado);
    },
    resetar: () => {
      bruto = null;
      gravar(criarSeed(clock.now()));
    },
  };
  bancoAtual = banco;
  return banco;
}

/**
 * Restaura os dados de demonstração (útil em testes manuais). A sessão atual não é alterada:
 * se o usuário logado deixar de existir, faça logout.
 */
export function resetMockDatabase(): void {
  if (bancoAtual) bancoAtual.resetar();
  else removerItem(obterLocalStorage(), CHAVE_BANCO_MOCK);
}

function interpretar(valor: string): DadosMock | null {
  try {
    const conteudo: unknown = JSON.parse(valor);
    if (!ehRegistro(conteudo) || conteudo.versao !== VERSAO || !ehRegistro(conteudo.dados))
      return null;
    const tabelas = conteudo.dados;
    return TABELAS.every((tabela) => Array.isArray(tabelas[tabela]))
      ? (tabelas as unknown as DadosMock)
      : null;
  } catch {
    return null;
  }
}
