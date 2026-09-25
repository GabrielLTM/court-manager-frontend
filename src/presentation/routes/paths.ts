import { Perfil } from '@/domain/enums';

/** Rotas previstas na especificação (Sprint 5) + dashboard do protótipo. */
export const ROUTES = {
  login: '/login',
  cadastro: '/cadastro',
  reservar: '/reservar',
  minhasReservas: '/minhas-reservas',
  meusDados: '/meus-dados',
  admin: {
    dashboard: '/admin/dashboard',
    reservas: '/admin/reservas',
    quadras: '/admin/quadras',
    clientes: '/admin/clientes',
    pagamentos: '/admin/pagamentos',
  },
} as const;

export function homePathFor(perfil: Perfil): string {
  return perfil === Perfil.Administrador ? ROUTES.admin.dashboard : ROUTES.reservar;
}
