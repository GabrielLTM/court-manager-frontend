import type { ClienteFiltro, PagamentoFiltro, ReservaFiltro } from '@/application/dto';

/** Chaves do React Query. As raízes são usadas para invalidação em cascata. */
export const queryRoots = {
  quadras: ['quadras'],
  disponibilidade: ['disponibilidade'],
  clientes: ['clientes'],
  reservas: ['reservas'],
  pagamentos: ['pagamentos'],
  dashboard: ['dashboard'],
  perfil: ['perfil'],
} as const;

export const queryKeys = {
  quadras: () => [...queryRoots.quadras] as const,
  disponibilidade: (quadraId: number, data: string) => [...queryRoots.disponibilidade, quadraId, data] as const,
  clientes: (filtro: ClienteFiltro = {}) => [...queryRoots.clientes, filtro] as const,
  reservas: (filtro: ReservaFiltro = {}) => [...queryRoots.reservas, filtro] as const,
  reserva: (id: number) => [...queryRoots.reservas, 'detalhe', id] as const,
  pagamentos: (filtro: PagamentoFiltro = {}) => [...queryRoots.pagamentos, filtro] as const,
  dashboard: (data: string) => [...queryRoots.dashboard, data] as const,
  perfil: () => [...queryRoots.perfil] as const,
};
