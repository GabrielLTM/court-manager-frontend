import { Navigate, Outlet } from 'react-router';
import type { Perfil } from '@/domain/enums';
import { useAuth } from '@/presentation/providers/AuthContext';
import { homePathFor, ROUTES } from '@/presentation/routes/paths';

/** Restringe as rotas filhas a um perfil; quem tem outro perfil vai para a própria home. */
export function RequireRole({ perfil }: { perfil: Perfil }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to={ROUTES.login} replace />;
  if (usuario.perfil !== perfil) return <Navigate to={homePathFor(usuario.perfil)} replace />;
  return <Outlet />;
}
