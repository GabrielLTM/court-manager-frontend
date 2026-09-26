import { AppError } from '@/application/errors';
import { MENSAGENS } from '@/application/mensagens';
import type { SessionStore } from '@/application/ports';
import type { Sessao } from '@/domain/entities';
import { Perfil } from '@/domain/enums';

export function exigirSessao(sessionStore: SessionStore): Sessao {
  const sessao = sessionStore.get();
  if (!sessao)
    throw new AppError(MENSAGENS.sessaoExpirada, { code: 'NAO_AUTENTICADO', status: 401 });
  return sessao;
}

export function ehAdministrador(sessao: Sessao | null): boolean {
  return sessao?.usuario.perfil === Perfil.Administrador;
}

/**
 * Para o perfil Cliente, devolve o `clienteId` ao qual as consultas devem ser restritas.
 * Para o administrador (ou sem sessão — o backend responderá 401) devolve `undefined`.
 */
export function clienteRestrito(sessao: Sessao | null): number | undefined {
  if (!sessao || sessao.usuario.perfil !== Perfil.Cliente) return undefined;
  if (sessao.usuario.clienteId === null) {
    throw new AppError(MENSAGENS.acessoNegado, { code: 'ACESSO_NEGADO', status: 403 });
  }
  return sessao.usuario.clienteId;
}

/** Exige um usuário logado com perfil Cliente (área "Meus dados"). */
export function exigirClienteLogado(sessionStore: SessionStore): {
  sessao: Sessao;
  clienteId: number;
} {
  const sessao = exigirSessao(sessionStore);
  const clienteId = clienteRestrito(sessao);
  if (clienteId === undefined) {
    throw new AppError(MENSAGENS.areaDoCliente, { code: 'ACESSO_NEGADO', status: 403 });
  }
  return { sessao, clienteId };
}
