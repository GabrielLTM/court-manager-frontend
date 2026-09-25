import { Perfil } from '@/domain/enums';

/** Contas de demonstração semeadas no backend simulado (modo mock). */
export const CONTAS_DEMO = {
  [Perfil.Cliente]: { email: 'isadora@email.com', senha: '123456', rotulo: 'Cliente' },
  [Perfil.Administrador]: { email: 'admin@arena.com', senha: 'admin123', rotulo: 'Administrador' },
} as const;
