import { isRouteErrorResponse } from 'react-router';

export interface InfoErroDeRota {
  codigo?: string;
  kicker: string;
  titulo: string;
  descricao: string;
}

/** Falha ao baixar o chunk de uma página (ex.: nova versão publicada ou conexão perdida). */
function falhaAoCarregarPagina(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(
    `${error.name} ${error.message}`,
  );
}

/** Traduz o erro capturado pela rota em uma mensagem amigável. */
export function descreverErroDeRota(error: unknown): InfoErroDeRota {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        codigo: '404',
        kicker: 'Página não encontrada',
        titulo: 'Bola fora!',
        descricao: 'O endereço acessado não existe ou foi movido.',
      };
    }
    return {
      codigo: String(error.status),
      kicker: 'Erro na página',
      titulo: 'Algo deu errado',
      descricao: 'Não foi possível exibir esta página agora. Tente novamente em instantes.',
    };
  }
  if (falhaAoCarregarPagina(error)) {
    return {
      kicker: 'Falha de carregamento',
      titulo: 'Não foi possível carregar a página',
      descricao:
        'Verifique sua conexão e recarregue — uma nova versão do sistema pode ter sido publicada.',
    };
  }
  return {
    kicker: 'Erro inesperado',
    titulo: 'Algo deu errado',
    descricao: 'Não conseguimos exibir esta página. Recarregue ou volte para o início.',
  };
}

/** Texto técnico do erro, para exibir apenas em desenvolvimento. */
export function detalhesTecnicos(error: unknown): string | undefined {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  return undefined;
}
