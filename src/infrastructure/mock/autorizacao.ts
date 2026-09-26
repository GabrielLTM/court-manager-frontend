import type { Clock, SessionStore } from '@/application/ports';
import { Perfil } from '@/domain/enums';
import { acessoNegado, naoAutenticado } from './erros';
import type { Solicitante } from './tipos';
import { verificarTokenSimulado } from './token';

export interface AutorizacaoMock {
  /** Equivale ao [Authorize]: exige um token válido (401 caso contrário). */
  autenticar(): Solicitante;
  /** Equivale ao [Authorize(Roles = "Administrador")] (403 para o perfil Cliente). */
  exigirAdministrador(): Solicitante;
}

/** Lê o "cabeçalho Authorization" da sessão atual, como o backend real faria com o JWT. */
export function criarAutorizacao(sessionStore: SessionStore, clock: Clock): AutorizacaoMock {
  const autenticar = (): Solicitante => {
    const sessao = sessionStore.get();
    if (!sessao) throw naoAutenticado();
    const solicitante = verificarTokenSimulado(sessao.token, clock.now());
    if (!solicitante) {
      // Mesmo comportamento do cliente HTTP ao receber 401: a sessão local é descartada.
      sessionStore.set(null);
      throw naoAutenticado();
    }
    return solicitante;
  };
  return {
    autenticar,
    exigirAdministrador: () => {
      const solicitante = autenticar();
      if (!ehAdministrador(solicitante)) throw acessoNegado();
      return solicitante;
    },
  };
}

export function ehAdministrador(solicitante: Solicitante): boolean {
  return solicitante.perfil === Perfil.Administrador;
}

/** O cliente só acessa os próprios registros; o administrador acessa todos. */
export function exigirAcessoAoCliente(
  solicitante: Solicitante,
  clienteId: number,
  mensagem?: string,
): void {
  if (!ehAdministrador(solicitante) && solicitante.clienteId !== clienteId)
    throw acessoNegado(mensagem);
}

/**
 * Listagens completas são do administrador. O cliente deve informar o próprio `clienteId`
 * (os casos de uso já fazem isso); outro id ou nenhum → 403.
 */
export function restringirAoCliente<F extends { clienteId?: number }>(
  solicitante: Solicitante,
  filtro: F,
  mensagem: string,
): F {
  if (ehAdministrador(solicitante)) return filtro;
  if (filtro.clienteId === undefined || filtro.clienteId !== solicitante.clienteId)
    throw acessoNegado(mensagem);
  return filtro;
}
