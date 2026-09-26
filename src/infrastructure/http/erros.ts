import { isAxiosError } from 'axios';
import { AppError, type CodigoErroAplicacao } from '@/application/errors';
import { MENSAGENS } from '@/application/mensagens';
import type { SessionStore } from '@/application/ports';
import { ehRegistro } from '@/infrastructure/shared/registro';
import { campo } from './mappers/leitura';

const MENSAGENS_HTTP = {
  semConexao: 'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
  tempoEsgotado: 'O servidor demorou demais para responder. Tente novamente.',
  dadosInvalidos: 'Dados inválidos. Revise os campos e tente novamente.',
  naoEncontrado: 'Registro não encontrado.',
  conflito: 'A operação conflita com dados já existentes.',
  erroServidor: 'Erro inesperado no servidor. Tente novamente mais tarde.',
  erroInesperado: 'Não foi possível concluir a operação.',
} as const;

/** Títulos padrão (em inglês) do ProblemDetails do ASP.NET Core — não servem como mensagem ao usuário. */
const TITULOS_PADRAO = new Set([
  'one or more validation errors occurred.',
  'bad request',
  'unauthorized',
  'forbidden',
  'not found',
  'conflict',
  'unprocessable entity',
  'internal server error',
  'an error occurred while processing your request.',
]);

interface CorpoDeErro {
  mensagem?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Converte falhas do axios em AppError (código + status + erros por campo). Corpos aceitos:
 * ProblemDetails/ValidationProblemDetails (`title`, `detail`, `errors`), `{ message }` ou texto.
 * 401 fora do login encerra a sessão local (token expirado/inválido).
 */
export function mapearErroHttp(erro: unknown, sessionStore: SessionStore): AppError {
  if (erro instanceof AppError) return erro;
  if (!isAxiosError(erro)) {
    const mensagem =
      erro instanceof Error && erro.message ? erro.message : MENSAGENS_HTTP.erroInesperado;
    return new AppError(mensagem, { cause: erro });
  }
  const resposta = erro.response;
  if (!resposta) {
    const tempoEsgotado = erro.code === 'ECONNABORTED' || erro.code === 'ETIMEDOUT';
    const mensagem = tempoEsgotado ? MENSAGENS_HTTP.tempoEsgotado : MENSAGENS_HTTP.semConexao;
    return new AppError(mensagem, { code: 'REDE', cause: erro });
  }

  const { status } = resposta;
  const { mensagem, fieldErrors } = lerCorpoDeErro(resposta.data);
  const login = ehRotaDeLogin(erro.config?.url);
  const criar = (code: CodigoErroAplicacao, texto: string, comErrosDeCampo = false) =>
    new AppError(texto, {
      code,
      status,
      cause: erro,
      fieldErrors: comErrosDeCampo ? fieldErrors : undefined,
    });

  switch (status) {
    case 400:
    case 422:
      return criar('VALIDACAO', mensagem ?? MENSAGENS_HTTP.dadosInvalidos, true);
    case 401:
      if (login) return criar('NAO_AUTENTICADO', MENSAGENS.credenciaisInvalidas);
      if (sessionStore.get()) sessionStore.set(null);
      return criar('NAO_AUTENTICADO', MENSAGENS.sessaoExpirada);
    case 403: {
      const padrao = login ? MENSAGENS.cadastroInativo : MENSAGENS.acessoNegado;
      return criar('ACESSO_NEGADO', mensagem ?? padrao);
    }
    case 404:
      return criar('NAO_ENCONTRADO', mensagem ?? MENSAGENS_HTTP.naoEncontrado);
    case 409:
      return criar('CONFLITO', mensagem ?? MENSAGENS_HTTP.conflito, true);
    default: {
      const padrao =
        status >= 500 ? MENSAGENS_HTTP.erroServidor : (mensagem ?? MENSAGENS_HTTP.erroInesperado);
      return criar('DESCONHECIDO', padrao);
    }
  }
}

function ehRotaDeLogin(url: string | undefined): boolean {
  return (url ?? '').split('?')[0].replace(/\/+$/, '').toLowerCase().endsWith('auth/login');
}

/** Texto curto e legível (descarta páginas HTML de erro e stack traces). */
function textoLegivel(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const texto = valor.trim();
  return texto && !texto.startsWith('<') && texto.length <= 300 ? texto : undefined;
}

function lerCorpoDeErro(corpo: unknown): CorpoDeErro {
  if (!ehRegistro(corpo)) return { mensagem: textoLegivel(corpo) };
  const fieldErrors = lerErrosDeCampo(campo(corpo, 'errors', 'erros'));
  const explicita = ['detail', 'message', 'mensagem', 'error', 'erro']
    .map((nome) => textoLegivel(campo(corpo, nome)))
    .find((texto) => texto !== undefined);
  const titulo = textoLegivel(campo(corpo, 'title'));
  const primeiroErroDeCampo = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
  return {
    mensagem:
      explicita ??
      primeiroErroDeCampo ??
      (titulo && !TITULOS_PADRAO.has(titulo.toLowerCase()) ? titulo : undefined),
    fieldErrors,
  };
}

/** `errors` do ValidationProblemDetails (`{ "Nome": ["..."], "$.valorHora": ["..."] }`) ou lista de textos. */
function lerErrosDeCampo(valor: unknown): Record<string, string[]> | undefined {
  const resultado: Record<string, string[]> = {};
  const adicionar = (chave: string, mensagens: unknown) => {
    const lista = (Array.isArray(mensagens) ? mensagens : [mensagens])
      .map(textoLegivel)
      .filter((texto): texto is string => texto !== undefined);
    if (!lista.length) return;
    const nome = normalizarNomeDoCampo(chave);
    resultado[nome] = [...(resultado[nome] ?? []), ...lista];
  };
  if (Array.isArray(valor)) adicionar('', valor);
  else if (ehRegistro(valor))
    Object.entries(valor).forEach(([chave, mensagens]) => adicionar(chave, mensagens));
  return Object.keys(resultado).length ? resultado : undefined;
}

/** "$.valorHora" → "valorHora"; "Nome" → "nome"; "Cliente.Email" → "cliente.email"; "" → "geral". */
function normalizarNomeDoCampo(chave: string): string {
  const semPrefixo = chave.replace(/^\$\.?/, '');
  if (!semPrefixo) return 'geral';
  return semPrefixo
    .split('.')
    .map((parte) => parte.charAt(0).toLowerCase() + parte.slice(1))
    .join('.');
}
