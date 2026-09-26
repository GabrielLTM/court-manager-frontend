import { Perfil } from '@/domain/enums';
import { ROUTES } from '@/presentation/routes/paths';

export interface ItemNavegacao {
  to: string;
  label: string;
}

/** Itens da navegação principal por perfil (mesma ordem e rótulos do protótipo). */
export const NAVEGACAO: Readonly<Record<Perfil, readonly ItemNavegacao[]>> = {
  [Perfil.Cliente]: [
    { to: ROUTES.reservar, label: 'Reservar quadra' },
    { to: ROUTES.minhasReservas, label: 'Minhas reservas' },
    { to: ROUTES.meusDados, label: 'Meus dados' },
  ],
  [Perfil.Administrador]: [
    { to: ROUTES.admin.dashboard, label: 'Dashboard' },
    { to: ROUTES.admin.reservas, label: 'Grade de reservas' },
    { to: ROUTES.admin.quadras, label: 'Quadras' },
    { to: ROUTES.admin.clientes, label: 'Clientes' },
    { to: ROUTES.admin.pagamentos, label: 'Pagamentos' },
  ],
};
