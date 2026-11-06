/**
 * Enums da especificação (seção 10). Os valores numéricos são idênticos aos enums
 * do backend C#, garantindo compatibilidade na serialização JSON.
 * Usamos objetos `as const` + union types (compatível com `erasableSyntaxOnly`).
 */

export const StatusCliente = { Ativo: 1, Inativo: 2 } as const;
export type StatusCliente = (typeof StatusCliente)[keyof typeof StatusCliente];

export const StatusQuadra = { Ativa: 1, Inativa: 2, Manutencao: 3 } as const;
export type StatusQuadra = (typeof StatusQuadra)[keyof typeof StatusQuadra];

export const StatusReserva = { Pendente: 1, Confirmada: 2, Cancelada: 3, Concluida: 4 } as const;
export type StatusReserva = (typeof StatusReserva)[keyof typeof StatusReserva];

export const StatusPagamento = { Pendente: 1, Pago: 2, Cancelado: 3, Estornado: 4 } as const;
export type StatusPagamento = (typeof StatusPagamento)[keyof typeof StatusPagamento];

export const MetodoPagamento = { Pix: 1, Cartao: 2, Dinheiro: 3 } as const;
export type MetodoPagamento = (typeof MetodoPagamento)[keyof typeof MetodoPagamento];

/** Perfis de usuário (seção 3). */
export const Perfil = { Cliente: 'Cliente', Administrador: 'Administrador' } as const;
export type Perfil = (typeof Perfil)[keyof typeof Perfil];

export const STATUS_CLIENTE_LABEL: Record<StatusCliente, string> = { 1: 'Ativo', 2: 'Inativo' };
export const STATUS_QUADRA_LABEL: Record<StatusQuadra, string> = { 1: 'Ativa', 2: 'Inativa', 3: 'Manutenção' };
export const STATUS_RESERVA_LABEL: Record<StatusReserva, string> = {
  1: 'Pendente',
  2: 'Confirmada',
  3: 'Cancelada',
  4: 'Concluída',
};
export const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  1: 'Pendente',
  2: 'Pago',
  3: 'Cancelado',
  4: 'Estornado',
};
export const METODO_PAGAMENTO_LABEL: Record<MetodoPagamento, string> = { 1: 'Pix', 2: 'Cartão', 3: 'Dinheiro' };
export const PERFIL_LABEL: Record<Perfil, string> = { Cliente: 'Cliente', Administrador: 'Administrador' };

export const STATUS_CLIENTE_VALUES = Object.values(StatusCliente) as StatusCliente[];
export const STATUS_QUADRA_VALUES = Object.values(StatusQuadra) as StatusQuadra[];
export const STATUS_RESERVA_VALUES = Object.values(StatusReserva) as StatusReserva[];
export const STATUS_PAGAMENTO_VALUES = Object.values(StatusPagamento) as StatusPagamento[];
export const METODO_PAGAMENTO_VALUES = Object.values(MetodoPagamento) as MetodoPagamento[];
