import { lazy } from 'react';

/**
 * Páginas carregadas sob demanda (um chunk por rota). As telas de erro de rota ficam fora
 * daqui de propósito: precisam funcionar mesmo quando o download de um chunk falha.
 */
export const LoginPage = lazy(() => import('@/presentation/features/auth/LoginPage'));

export const ReservarPage = lazy(() => import('@/presentation/features/reservar/ReservarPage'));
export const MinhasReservasPage = lazy(
  () => import('@/presentation/features/minhas-reservas/MinhasReservasPage'),
);
export const MeusDadosPage = lazy(() => import('@/presentation/features/perfil/MeusDadosPage'));

export const DashboardPage = lazy(
  () => import('@/presentation/features/admin/dashboard/DashboardPage'),
);
export const GradeReservasPage = lazy(
  () => import('@/presentation/features/admin/grade/GradeReservasPage'),
);
export const QuadrasPage = lazy(() => import('@/presentation/features/admin/quadras/QuadrasPage'));
export const ClientesPage = lazy(
  () => import('@/presentation/features/admin/clientes/ClientesPage'),
);
export const PagamentosPage = lazy(
  () => import('@/presentation/features/admin/pagamentos/PagamentosPage'),
);

export const NotFoundPage = lazy(() => import('@/presentation/features/errors/NotFoundPage'));
