import type { Clock, SessionStore } from '@/application/ports';
import type { Sessao } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { systemClock } from '@/infrastructure/clock/SystemClock';
import { ehRegistro } from '@/infrastructure/shared/registro';
import {
  type Armazenamento,
  gravarItem,
  lerItem,
  obterLocalStorage,
  removerItem,
} from './armazenamento';

export const CHAVE_SESSAO = 'arena.sessao';

/** Maior atraso aceito por setTimeout (~24,8 dias). */
const MAIOR_ATRASO_TIMER = 2_147_483_647;

export interface OpcoesSessionStore {
  /** Padrão: localStorage (com fallback silencioso para memória). `null` = somente memória. */
  storage?: Armazenamento | null;
  clock?: Clock;
  /** Sincroniza login/logout entre abas via evento `storage` (padrão: true com o localStorage). */
  sincronizarAbas?: boolean;
}

/**
 * Sessão (token JWT + usuário) persistida em `arena.sessao`. `get()` devolve sempre a mesma
 * referência enquanto a sessão não muda (requisito do useSyncExternalStore) e descarta sessões
 * expiradas (`expiraEm`), inclusive com um timer que faz o logout automático na expiração.
 */
export function createLocalStorageSessionStore(opcoes: OpcoesSessionStore = {}): SessionStore {
  const usaLocalStorage = opcoes.storage === undefined;
  const storage = usaLocalStorage ? obterLocalStorage() : (opcoes.storage ?? null);
  const clock = opcoes.clock ?? systemClock;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expirou = (sessao: Sessao) =>
    sessao.expiraEm !== null && Date.parse(sessao.expiraEm) <= clock.now().getTime();

  const notificar = () => [...listeners].forEach((listener) => listener());

  function interpretar(bruto: string | null): Sessao | null {
    if (!bruto) return null;
    try {
      const sessao = normalizarSessao(JSON.parse(bruto));
      return sessao && !expirou(sessao) ? sessao : null;
    } catch {
      return null;
    }
  }

  const inicial = lerItem(storage, CHAVE_SESSAO);
  let atual = interpretar(inicial);
  if (inicial !== null && atual === null) removerItem(storage, CHAVE_SESSAO);

  function agendarExpiracao(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (!atual?.expiraEm) return;
    const restante = Date.parse(atual.expiraEm) - clock.now().getTime();
    if (!Number.isFinite(restante)) return;
    timer = setTimeout(
      () => {
        timer = undefined;
        if (atual && expirou(atual)) definir(null);
        else agendarExpiracao();
      },
      Math.min(Math.max(restante, 0), MAIOR_ATRASO_TIMER),
    );
  }

  function definir(sessao: Sessao | null): void {
    atual = sessao;
    if (sessao) gravarItem(storage, CHAVE_SESSAO, JSON.stringify(sessao));
    else removerItem(storage, CHAVE_SESSAO);
    agendarExpiracao();
    notificar();
  }

  agendarExpiracao();

  if (usaLocalStorage && opcoes.sincronizarAbas !== false && typeof window !== 'undefined') {
    window.addEventListener('storage', (evento) => {
      if (evento.key !== null && evento.key !== CHAVE_SESSAO) return;
      const nova = interpretar(lerItem(storage, CHAVE_SESSAO));
      if (JSON.stringify(nova) === JSON.stringify(atual)) return;
      atual = nova;
      agendarExpiracao();
      notificar();
    });
  }

  return {
    get: () => {
      if (atual && expirou(atual)) {
        // Pode ser chamado durante a renderização: limpa agora e notifica fora do ciclo atual.
        atual = null;
        removerItem(storage, CHAVE_SESSAO);
        agendarExpiracao();
        setTimeout(notificar, 0);
      }
      return atual;
    },
    set: (sessao) => definir(sessao),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function ehPerfil(valor: unknown): valor is Perfil {
  return valor === Perfil.Cliente || valor === Perfil.Administrador;
}

/** Valida o JSON persistido (pode ter sido editado ou gravado por outra versão da aplicação). */
function normalizarSessao(valor: unknown): Sessao | null {
  if (!ehRegistro(valor) || typeof valor.token !== 'string' || !valor.token) return null;
  const usuario = valor.usuario;
  if (!ehRegistro(usuario)) return null;
  const { id, nome, email, perfil, clienteId } = usuario;
  if (
    typeof id !== 'number' ||
    typeof nome !== 'string' ||
    typeof email !== 'string' ||
    !ehPerfil(perfil)
  ) {
    return null;
  }
  return {
    token: valor.token,
    expiraEm: typeof valor.expiraEm === 'string' ? valor.expiraEm : null,
    usuario: {
      id,
      nome,
      email,
      perfil,
      clienteId: typeof clienteId === 'number' ? clienteId : null,
    },
  };
}
