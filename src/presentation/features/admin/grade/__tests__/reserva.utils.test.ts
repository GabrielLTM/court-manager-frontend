import { StatusPagamento, StatusReserva } from '@/domain/enums';
import { umPagamento, umaQuadra, umaReserva } from '../../__tests__/fixtures';
import {
  acoesDaReserva,
  avisoDoPagamentoAoCancelar,
  duracaoInicial,
  horarioDisponivel,
  houveAlteracao,
  ocupadosSemAReserva,
  slotsDaAlteracao,
} from '../reserva.utils';

/** "Agora": 20/09/2026 às 10:00. */
const AGORA = new Date(2026, 8, 20, 10, 0);

describe('acoesDaReserva', () => {
  it('permite alterar e cancelar uma reserva futura', () => {
    expect(acoesDaReserva(umaReserva(), AGORA)).toEqual({
      status: StatusReserva.Confirmada,
      podeAlterar: true,
      podeCancelar: true,
    });
  });

  it('o administrador não está sujeito à antecedência de 4 horas (RN08)', () => {
    const emUmaHora = umaReserva({ horaInicio: '11:00', horaFim: '12:00' });
    expect(acoesDaReserva(emUmaHora, AGORA)).toMatchObject({ podeAlterar: true, podeCancelar: true });
  });

  it('trata como concluída a reserva confirmada que já terminou', () => {
    const passada = umaReserva({ horaInicio: '08:00', horaFim: '09:00' });
    expect(acoesDaReserva(passada, AGORA)).toEqual({
      status: StatusReserva.Concluida,
      podeAlterar: false,
      podeCancelar: false,
    });
  });

  it('não oferece ações para reservas canceladas ou pendentes já encerradas', () => {
    expect(acoesDaReserva(umaReserva({ status: StatusReserva.Cancelada }), AGORA)).toMatchObject({
      status: StatusReserva.Cancelada,
      podeAlterar: false,
      podeCancelar: false,
    });
    const pendenteVencida = umaReserva({ status: StatusReserva.Pendente, data: '2026-09-19' });
    expect(acoesDaReserva(pendenteVencida, AGORA)).toMatchObject({ podeAlterar: false, podeCancelar: false });
  });
});

describe('avisoDoPagamentoAoCancelar', () => {
  it('explica o que acontece com o pagamento', () => {
    expect(avisoDoPagamentoAoCancelar(umPagamento())).toBe('O pagamento será estornado.');
    expect(avisoDoPagamentoAoCancelar(umPagamento({ status: StatusPagamento.Pendente }))).toBe(
      'O pagamento será cancelado.',
    );
    expect(avisoDoPagamentoAoCancelar(null)).toBe('Não há pagamento a estornar.');
  });
});

describe('duracaoInicial', () => {
  it('mantém durações ofertadas e usa 1 hora nas demais', () => {
    expect(duracaoInicial({ horaInicio: '18:00', horaFim: '19:30' })).toBe(90);
    expect(duracaoInicial({ horaInicio: '08:00', horaFim: '10:00' })).toBe(120);
    expect(duracaoInicial({ horaInicio: '08:00', horaFim: '08:45' })).toBe(60);
  });
});

describe('ocupadosSemAReserva', () => {
  const reserva = { quadraId: 1, data: '2026-09-20', horaInicio: '19:00', horaFim: '20:00' };
  const ocupados = [
    { inicio: '10:00', fim: '11:00' },
    { inicio: '19:00', fim: '20:00' },
  ];

  it('remove o intervalo da própria reserva na mesma quadra e data', () => {
    expect(ocupadosSemAReserva(ocupados, reserva, 1, '2026-09-20')).toEqual([{ inicio: '10:00', fim: '11:00' }]);
  });

  it('aceita horários no formato TimeOnly ("19:00:00")', () => {
    const doBackend = [{ inicio: '19:00:00', fim: '20:00:00' }];
    expect(ocupadosSemAReserva(doBackend, reserva, 1, '2026-09-20')).toEqual([]);
  });

  it('mantém tudo em outra quadra ou outra data', () => {
    expect(ocupadosSemAReserva(ocupados, reserva, 3, '2026-09-20')).toEqual(ocupados);
    expect(ocupadosSemAReserva(ocupados, reserva, 1, '2026-09-21')).toEqual(ocupados);
  });
});

describe('slotsDaAlteracao', () => {
  const reserva = umaReserva();
  const disponibilidade = {
    ocupados: [
      { inicio: '15:00', fim: '16:00' },
      { inicio: '19:00', fim: '20:00' },
    ],
  };
  const slot = (slots: ReturnType<typeof slotsDaAlteracao>, hora: string) => slots.find((s) => s.hora === hora);

  it('exibe o horário atual da reserva como livre', () => {
    const slots = slotsDaAlteracao({
      reserva,
      quadra: umaQuadra(),
      data: reserva.data,
      duracaoMinutos: 60,
      disponibilidade,
      agora: AGORA,
    });
    expect(slot(slots, '19:00')).toMatchObject({ disponivel: true });
    expect(slot(slots, '15:00')).toMatchObject({ disponivel: false, motivo: 'ocupado' });
    expect(slot(slots, '09:00')).toMatchObject({ disponivel: false, motivo: 'passado' });
  });

  it('em outra quadra, o intervalo ocupado continua bloqueado', () => {
    const slots = slotsDaAlteracao({
      reserva,
      quadra: umaQuadra({ id: 3, nome: 'Quadra 03' }),
      data: reserva.data,
      duracaoMinutos: 60,
      disponibilidade,
      agora: AGORA,
    });
    expect(slot(slots, '19:00')).toMatchObject({ disponivel: false, motivo: 'ocupado' });
  });

  it('considera a duração escolhida (1h30 às 18:00 conflita com 19:00 de outra reserva)', () => {
    const outra = umaReserva({ id: 1050, horaInicio: '10:00', horaFim: '11:00' });
    const slots = slotsDaAlteracao({
      reserva: outra,
      quadra: umaQuadra(),
      data: outra.data,
      duracaoMinutos: 90,
      disponibilidade,
      agora: AGORA,
    });
    expect(slot(slots, '18:00')).toMatchObject({ disponivel: false, motivo: 'ocupado' });
    expect(slot(slots, '21:00')).toMatchObject({ disponivel: false, motivo: 'fora-do-horario' });
  });
});

describe('houveAlteracao', () => {
  const reserva = umaReserva();
  const atual = { quadraId: 1, data: '2026-09-20', duracaoMinutos: 60, horaInicio: '19:00' };

  it('detecta mudança de quadra, data, horário ou duração', () => {
    expect(houveAlteracao(reserva, atual)).toBe(false);
    expect(houveAlteracao(reserva, { ...atual, quadraId: 3 })).toBe(true);
    expect(houveAlteracao(reserva, { ...atual, data: '2026-09-21' })).toBe(true);
    expect(houveAlteracao(reserva, { ...atual, horaInicio: '20:00' })).toBe(true);
    expect(houveAlteracao(reserva, { ...atual, duracaoMinutos: 90 })).toBe(true);
  });
});

describe('horarioDisponivel', () => {
  const slots = [
    { hora: '19:00', fim: '20:00', disponivel: true },
    { hora: '20:00', fim: '21:00', disponivel: false, motivo: 'ocupado' as const },
  ];

  it('só aceita horários livres', () => {
    expect(horarioDisponivel(slots, '19:00')).toBe(true);
    expect(horarioDisponivel(slots, '20:00')).toBe(false);
    expect(horarioDisponivel(slots, '21:00')).toBe(false);
    expect(horarioDisponivel(slots, null)).toBe(false);
  });
});
