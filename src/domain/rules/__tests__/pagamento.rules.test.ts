import { describe, expect, it } from 'vitest';
import { MetodoPagamento, StatusPagamento, StatusReserva } from '@/domain/enums';
import {
  pagamentoPodeSerConfirmado,
  statusDaReservaAposPagamento,
  statusDoPagamentoAoCancelarReserva,
  statusInicialDoPagamento,
} from '@/domain/rules';

describe('pagamento simulado (7.4)', () => {
  it('Pix e Cartão são aprovados na hora; Dinheiro fica pendente', () => {
    expect(statusInicialDoPagamento(MetodoPagamento.Pix)).toBe(StatusPagamento.Pago);
    expect(statusInicialDoPagamento(MetodoPagamento.Cartao)).toBe(StatusPagamento.Pago);
    expect(statusInicialDoPagamento(MetodoPagamento.Dinheiro)).toBe(StatusPagamento.Pendente);
  });

  it('cancelar a reserva estorna o pago e cancela o pendente', () => {
    expect(statusDoPagamentoAoCancelarReserva(StatusPagamento.Pago)).toBe(
      StatusPagamento.Estornado,
    );
    expect(statusDoPagamentoAoCancelarReserva(StatusPagamento.Pendente)).toBe(
      StatusPagamento.Cancelado,
    );
  });

  it('somente pendentes podem ser confirmados (RF16)', () => {
    expect(pagamentoPodeSerConfirmado({ status: StatusPagamento.Pendente })).toBe(true);
    expect(pagamentoPodeSerConfirmado({ status: StatusPagamento.Pago })).toBe(false);
  });

  it('registrar o pagamento confirma a reserva pendente', () => {
    expect(statusDaReservaAposPagamento(StatusReserva.Pendente)).toBe(StatusReserva.Confirmada);
    expect(statusDaReservaAposPagamento(StatusReserva.Concluida)).toBe(StatusReserva.Concluida);
  });
});
