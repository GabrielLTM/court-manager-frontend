import { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/presentation/providers/AuthContext';
import { ROUTES } from '@/presentation/routes/paths';
import { estadoDeLogin } from './access';

/**
 * Exige uma sessão ativa. Sem sessão — nunca entrou, clicou em "Sair", o token expirou ou a API
 * respondeu 401 e o SessionStore foi limpo — redireciona para /login guardando a página de
 * origem em `state.from`. O AuthProvider é reativo ao SessionStore (useSyncExternalStore),
 * então a perda de sessão é detectada automaticamente, em qualquer tela.
 */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const state = useMemo(() => estadoDeLogin(location), [location]);

  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace state={state} />;
  return <Outlet />;
}
