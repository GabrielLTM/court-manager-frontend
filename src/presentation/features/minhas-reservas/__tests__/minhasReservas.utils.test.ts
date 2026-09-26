import type { ReservaDetalhada } from '@/application/dto';
import type { Pagamento } from '@/domain/entities';
import { MetodoPagamento, StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';
import { calcularDuracaoMinutos } from '@/domain/rules';
import {
  calcularEstatisticas,
  descreverAgendamento,
  destinoDoPagamentoAoCancelar,
  formatHorasJogadas,
  linhasCancelamento,
  linhasPagamento,
  mensagemPagamentoRegistrado,
  mensagemReservaCancelada,
  ordenarReservas,
  pagamentoPendente,
  podePagar,
} from '../minhasReservas.utils';

/** "Agora": 20/09/2026 às 10:00. */
const agora = new Date(2026, 8, 20, 10, 0);

const pagamento = (
  reservaId: number,
  status: StatusPagamento,
  metodo: MetodoPagamento = MetodoPagamento.Pix,
): Pagamento => ({
  id: reservaId + 5000,
  reservaId,
  valor: 80,
  metodo,
  status,
  dataPagamento: null,
});

function reserva(
  id: number,
  data: string,
  horaInicio: string,
  horaFim: string,
  status: StatusReserva,
  pag: Pagamento | null = null,
): ReservaDetalhada {
  return {
    id,
    clienteId: 1,
    quadraId: 1,
    data,
    horaInicio,
    horaFim,
    valor: 80,
    status,
    dataCriacao: '2026-09-01T12:00:00.000Z',
    duracaoMinutos: calcularDuracaoMinutos(horaInicio, horaFim),
    quadra: { id: 1, nome: 'Quadra 01', tipo: 'Beach Tennis', valorHora: 80, status: StatusQuadra.Ativa },
    cliente: { id: 1, nome: 'Isadora Oliveira' },
    pagamento: pag,
  };
}

const hojeMaisTarde = reserva(1041, '2026-09-20', '19:00', '20:00', StatusReserva.Confirmada, pagamento(1041, StatusPagamento.Pago));
const amanhaSemPagamento = reserva(1043, '2026-09-21', '20:00', '21:00', StatusReserva.Pendente);
const concluida = reserva(1046, '2026-09-14', '07:00', '08:00', StatusReserva.Concluida, pagamento(1046, StatusPagamento.Pago));
const confirmadaJaJogada = reserva(1050, '2026-09-18', '18:00', '19:30', StatusReserva.Confirmada, pagamento(1050, StatusPagamento.Pago));
const emAndamento = reserva(1051, '2026-09-20', '09:30', '10:30', StatusReserva.Confirmada, pagamento(1051, StatusPagamento.Pendente, MetodoPagamento.Dinheiro));
const cancelada = reserva(1052, '2026-09-25', '08:00', '09:00', StatusReserva.Cancelada, pagamento(1052, StatusPagamento.Estornado));
const mesPassado = reserva(1030, '2026-08-30', '10:00', '12:00', StatusReserva.Concluida, pagamento(1030, StatusPagamento.Pago));

describe('calcularEstatisticas', () => {
  it('conta próximas reservas, pagamentos pendentes e horas jogadas no mês', () => {
    const estatisticas = calcularEstatisticas(
      [hojeMaisTarde, amanhaSemPagamento, concluida, confirmadaJaJogada, emAndamento, cancelada, mesPassado],
      agora,
    );
    expect(estatisticas).toEqual({
      // 1041 (hoje 19:00) e 1043 (amanhã); a 1051 já começou e a 1052 foi cancelada.
      proximasReservas: 2,
      // 1043 sem pagamento e 1051 em dinheiro; cancelada não conta.
      pagamentosPendentes: 2,
      // 1046 (60 min) + 1050 (90 min, confirmada e encerrada); agosto não entra.
      minutosJogadosNoMes: 150,
    });
  });

  it('zera tudo sem reservas', () => {
    expect(calcularEstatisticas([], agora)).toEqual({
      proximasReservas: 0,
      pagamentosPendentes: 0,
      minutosJogadosNoMes: 0,
    });
  });
});

describe('formatHorasJogadas', () => {
  it('usa o formato curto de duração e "0h" sem jogos', () => {
    expect(formatHorasJogadas(0)).toBe('0h');
    expect(formatHorasJogadas(60)).toBe('1h');
    expect(formatHorasJogadas(150)).toBe('2h30');
  });
});

describe('ordenarReservas', () => {
  it('lista as próximas em ordem cronológica e depois as passadas da mais recente', () => {
    const ordenadas = ordenarReservas(
      [concluida, amanhaSemPagamento, mesPassado, hojeMaisTarde, confirmadaJaJogada, emAndamento, cancelada],
      agora,
    );
    expect(ordenadas.map((r) => r.id)).toEqual([1051, 1041, 1043, 1052, 1050, 1046, 1030]);
  });

  it('não altera a lista original', () => {
    const lista = [concluida, hojeMaisTarde];
    ordenarReservas(lista, agora);
    expect(lista.map((r) => r.id)).toEqual([1046, 1041]);
  });
});

describe('pagamento', () => {
  it('só permite pagar reservas ativas sem pagamento', () => {
    expect(podePagar(amanhaSemPagamento)).toBe(true);
    expect(podePagar(hojeMaisTarde)).toBe(false);
    expect(podePagar({ status: StatusReserva.Cancelada, pagamento: null })).toBe(false);
  });

  it('considera pendente o pagamento inexistente ou pendente de reservas não canceladas', () => {
    expect(pagamentoPendente(amanhaSemPagamento)).toBe(true);
    expect(pagamentoPendente(emAndamento)).toBe(true);
    expect(pagamentoPendente(hojeMaisTarde)).toBe(false);
    expect(pagamentoPendente({ status: StatusReserva.Cancelada, pagamento: null })).toBe(false);
  });

  it('informa o destino do pagamento ao cancelar', () => {
    expect(destinoDoPagamentoAoCancelar(hojeMaisTarde.pagamento)).toBe('Será estornado');
    expect(destinoDoPagamentoAoCancelar(emAndamento.pagamento)).toBe('Será cancelado');
    expect(destinoDoPagamentoAoCancelar(null)).toBe('Será cancelado');
  });
});

describe('textos', () => {
  it('descreve o agendamento como no protótipo', () => {
    expect(descreverAgendamento(amanhaSemPagamento)).toBe('21/09 · 20:00–21:00');
  });

  it('monta as linhas dos diálogos', () => {
    expect(linhasCancelamento(amanhaSemPagamento)).toEqual([
      { label: 'Reserva', value: 'RSV-1043' },
      { label: 'Quadra', value: 'Quadra 01' },
      { label: 'Horário', value: '21/09 · 20:00–21:00' },
      { label: 'Pagamento', value: 'Será cancelado' },
    ]);
    expect(linhasPagamento({ ...amanhaSemPagamento, quadra: null, valor: 70 })).toEqual([
      { label: 'Reserva', value: 'RSV-1043' },
      { label: 'Quadra', value: '—' },
      { label: 'Horário', value: '21/09 · 20:00–21:00' },
      { label: 'Valor', value: 'R$ 70,00' },
    ]);
  });

  it('formata as mensagens de sucesso', () => {
    expect(mensagemReservaCancelada(1043)).toBe('Reserva RSV-1043 cancelada — horário liberado');
    expect(mensagemPagamentoRegistrado({ reservaId: 1043, status: StatusPagamento.Pago, valor: 70 })).toBe(
      'Pagamento RSV-1043 aprovado — R$ 70,00',
    );
    expect(mensagemPagamentoRegistrado({ reservaId: 1043, status: StatusPagamento.Pendente, valor: 70 })).toBe(
      'Pagamento RSV-1043 registrado — pague na arena',
    );
  });
});
