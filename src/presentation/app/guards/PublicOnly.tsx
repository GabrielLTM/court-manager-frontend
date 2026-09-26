import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/presentation/providers/AuthContext';
import { destinoAposLogin } from './access';

/**
 * Rotas públicas (/login e /cadastro). Assim que existe sessão — inclusive logo após o login ou
 * o cadastro — segue para a página de origem (se permitida ao perfil) ou para a home do perfil.
 * Centralizar o redirecionamento aqui evita navegações concorrentes com o formulário.
 */
export function PublicOnly() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (usuario) return <Navigate to={destinoAposLogin(location.state, usuario.perfil)} replace />;
  return <Outlet />;
}
