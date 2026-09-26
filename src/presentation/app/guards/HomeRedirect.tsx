import { Navigate } from 'react-router';
import { useAuth } from '@/presentation/providers/AuthContext';
import { homePathFor, ROUTES } from '@/presentation/routes/paths';

/** "/" → home do perfil logado, ou /login sem sessão. */
export function HomeRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? homePathFor(usuario.perfil) : ROUTES.login} replace />;
}
