import { MetodoPagamento, StatusPagamento } from '@/domain/enums';
import {
  descreverPagamento,
  formatInicioReserva,
  formatPeriodoReserva,
  formatPeriodoReservaCompleto,
  normalizarBusca,
  pluralizar,
} from '../format';

const reserva = { data: '2026-09-20', horaInicio: '19:00', horaFim: '20:00' };

describe('formatação de reservas', () => {
  it('formata início e período como no protótipo', () => {
    expect(formatInicioReserva(reserva)).toBe('20/09 · 19:00');
    expect(formatPeriodoReserva(reserva)).toBe('20/09 · 19:00–20:00');
    expect(formatPeriodoReservaCompleto(reserva)).toBe('20/09/2026 · 19:00–20:00');
  });

  it('descreve o pagamento (método · status) ou a ausência dele', () => {
    expect(descreverPagamento({ metodo: MetodoPagamento.Pix, status: StatusPagamento.Pago })).toBe('Pix · Pago');
    expect(descreverPagamento({ metodo: MetodoPagamento.Dinheiro, status: StatusPagamento.Pendente })).toBe(
      'Dinheiro · Pendente',
    );
    expect(descreverPagamento(null)).toBe('Não registrado');
  });
});

describe('pluralizar', () => {
  it('usa o singular apenas para 1', () => {
    expect(pluralizar(1, 'ativa', 'ativas')).toBe('1 ativa');
    expect(pluralizar(4, 'ativa', 'ativas')).toBe('4 ativas');
    expect(pluralizar(0, 'reserva', 'reservas')).toBe('0 reservas');
  });
});

describe('normalizarBusca', () => {
  it('remove acentos, espaços nas pontas e diferença de maiúsculas', () => {
    expect(normalizarBusca('  Alexandre De ÁVILA ')).toBe('alexandre de avila');
    expect(normalizarBusca('Patrícia Nunes')).toBe('patricia nunes');
  });
});
