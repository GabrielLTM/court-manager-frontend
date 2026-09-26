import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { Perfil } from '@/domain/enums';
import RouteErrorPage from '@/presentation/features/errors/RouteErrorPage';
import { ROUTES } from '@/presentation/routes/paths';
import { HomeRedirect } from './guards/HomeRedirect';
import { PublicOnly } from './guards/PublicOnly';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { AppLayout } from './layout/AppLayout';
import {
  ClientesPage,
  DashboardPage,
  GradeReservasPage,
  LoginPage,
  MeusDadosPage,
  MinhasReservasPage,
  NotFoundPage,
  PagamentosPage,
  QuadrasPage,
  ReservarPage,
} from './lazyPages';
import type { RouteHandle } from './routeHandle';
import { RootLayout } from './RootLayout';

const titulo = (title: string): RouteHandle => ({ title });

/**
 * Mapa de rotas (Sprint 5 + protótipo). Os guards são rotas de layout:
 *   PublicOnly  → /login, /cadastro (com sessão, segue para a origem ou a home do perfil)
 *   RequireAuth → AppLayout → RequireRole(Cliente | Administrador) → páginas
 * Erros de uma página aparecem dentro do layout; os demais, em tela cheia.
 */
export const appRoutes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        element: <PublicOnly />,
        children: [
          { path: ROUTES.login, element: <LoginPage modo="entrar" />, handle: titulo('Entrar') },
          {
            path: ROUTES.cadastro,
            element: <LoginPage modo="criar" />,
            handle: titulo('Criar conta'),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequireRole perfil={Perfil.Cliente} />,
                errorElement: <RouteErrorPage embedded />,
                children: [
                  {
                    path: ROUTES.reservar,
                    element: <ReservarPage />,
                    handle: titulo('Reservar quadra'),
                  },
                  {
                    path: ROUTES.minhasReservas,
                    element: <MinhasReservasPage />,
                    handle: titulo('Minhas reservas'),
                  },
                  {
                    path: ROUTES.meusDados,
                    element: <MeusDadosPage />,
                    handle: titulo('Meus dados'),
                  },
                ],
              },
              {
                path: '/admin',
                element: <RequireRole perfil={Perfil.Administrador} />,
                errorElement: <RouteErrorPage embedded />,
                children: [
                  { index: true, element: <Navigate to={ROUTES.admin.dashboard} replace /> },
                  {
                    path: ROUTES.admin.dashboard,
                    element: <DashboardPage />,
                    handle: titulo('Dashboard'),
                  },
                  {
                    path: ROUTES.admin.reservas,
                    element: <GradeReservasPage />,
                    handle: titulo('Grade de reservas'),
                  },
                  {
                    path: ROUTES.admin.quadras,
                    element: <QuadrasPage />,
                    handle: titulo('Quadras'),
                  },
                  {
                    path: ROUTES.admin.clientes,
                    element: <ClientesPage />,
                    handle: titulo('Clientes'),
                  },
                  {
                    path: ROUTES.admin.pagamentos,
                    element: <PagamentosPage />,
                    handle: titulo('Pagamentos'),
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage />, handle: titulo('Página não encontrada') },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
