import type { AuthService } from '@/application/services';
import { toISODate } from '@/shared/lib/date';
import type { AppDependencies } from './dependencies';
import { normalizarDadosCliente, validarDadosCliente } from './validarDadosCliente';

/** Autenticação (Sprint 5 — JWT): o gateway emite a sessão e o SessionStore a mantém. */
export function createAuthService({
  authGateway,
  sessionStore,
  clock,
}: AppDependencies): AuthService {
  return {
    login: async (input) => {
      const sessao = await authGateway.login({ email: input.email.trim(), senha: input.senha });
      sessionStore.set(sessao);
      return sessao;
    },
    registrar: async (input) => {
      validarDadosCliente(input, { exigirSenha: true, hoje: toISODate(clock.now()) });
      const sessao = await authGateway.registrar({ ...input, ...normalizarDadosCliente(input) });
      sessionStore.set(sessao);
      return sessao;
    },
    logout: () => sessionStore.set(null),
    sessaoAtual: () => sessionStore.get(),
    subscribe: (listener) => sessionStore.subscribe(listener),
  };
}
