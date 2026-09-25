import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { LoginInput, RegistrarClienteInput } from '@/application/dto';
import { Perfil } from '@/domain/enums';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { useServices } from './ServicesContext';

/** Expõe a sessão atual (reativa ao SessionStore) e as ações de autenticação. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices();
  const queryClient = useQueryClient();

  const subscribe = useCallback((listener: () => void) => auth.subscribe(listener), [auth]);
  const getSnapshot = useCallback(() => auth.sessaoAtual(), [auth]);
  const sessao = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const value = useMemo<AuthContextValue>(
    () => ({
      sessao,
      usuario: sessao?.usuario ?? null,
      isAuthenticated: sessao !== null,
      isAdmin: sessao?.usuario.perfil === Perfil.Administrador,
      async login(input: LoginInput) {
        const nova = await auth.login(input);
        queryClient.clear();
        return nova;
      },
      async registrar(input: RegistrarClienteInput) {
        const nova = await auth.registrar(input);
        queryClient.clear();
        return nova;
      },
      logout() {
        auth.logout();
        queryClient.clear();
      },
    }),
    [auth, queryClient, sessao],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
