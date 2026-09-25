import type { Pagamento } from '@/domain/entities';
import { MetodoPagamento, StatusPagamento, StatusReserva } from '@/domain/enums';

/**
 * 7.4 — pagamento simulado (sem gateway real): Pix e Cartão são aprovados na hora;
 * Dinheiro fica Pendente até o administrador confirmar o recebimento (RF16).
 */
export function statusInicialDoPagamento(metodo: MetodoPagamento): StatusPagamento {
  return metodo === MetodoPagamento.Dinheiro ? StatusPagamento.Pendente : StatusPagamento.Pago;
}

/** Ao cancelar a reserva: pagamento Pago é Estornado; Pendente é Cancelado. */
export function statusDoPagamentoAoCancelarReserva(status: StatusPagamento): StatusPagamento {
  if (status === StatusPagamento.Pago) return StatusPagamento.Estornado;
  if (status === StatusPagamento.Pendente) return StatusPagamento.Cancelado;
  return status;
}

/** RF16 — somente pagamentos pendentes podem ser confirmados. */
export function pagamentoPodeSerConfirmado(pagamento: Pick<Pagamento, 'status'>): boolean {
  return pagamento.status === StatusPagamento.Pendente;
}

/** Registrar o pagamento garante o horário: a reserva Pendente passa a Confirmada. */
export function statusDaReservaAposPagamento(status: StatusReserva): StatusReserva {
  return status === StatusReserva.Pendente ? StatusReserva.Confirmada : status;
}
