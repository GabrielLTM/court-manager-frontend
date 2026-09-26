import { describe, expect, it } from 'vitest';
import type { Quadra, Reserva, Slot } from '@/domain/entities';
import { Perfil, StatusCliente, StatusQuadra, StatusReserva } from '@/domain/enums';
import {
  calcularValorReserva,
  gerarSlots,
  haConflitoDeHorario,
  intervalosSobrepoem,
  podeCancelarReserva,
  statusEfetivoDaReserva,
  validarReserva,
} from '@/domain/rules';

const reserva = (parcial: Partial<Reserva> = {}): Reserva => ({
  id: 1,
  clienteId: 1,
  quadraId: 1,
  data: '2026-09-20',
  horaInicio: '19:00',
  horaFim: '20:00',
  valor: 80,
  status: StatusReserva.Confirmada,
  dataCriacao: '2026-09-10T12:00:00.000Z',
  ...parcial,
});

const quadra = (parcial: Partial<Quadra> = {}): Quadra => ({
  id: 1,
  nome: 'Quadra 01',
  tipo: 'Beach Tennis',
  valorHora: 80,
  status: StatusQuadra.Ativa,
  ...parcial,
});

describe('RN04 — conflito de horário', () => {
  it('19:00–20:00 conflita com 19:30–20:30 (exemplo da especificação)', () => {
    expect(
      intervalosSobrepoem({ inicio: '19:00', fim: '20:00' }, { inicio: '19:30', fim: '20:30' }),
    ).toBe(true);
    expect(
      haConflitoDeHorario([reserva()], {
        quadraId: 1,
        data: '2026-09-20',
        inicio: '19:30',
        fim: '20:30',
      }),
    ).toBe(true);
  });

  it('intervalos que apenas se encostam não conflitam', () => {
    expect(
      intervalosSobrepoem({ inicio: '19:00', fim: '20:00' }, { inicio: '20:00', fim: '21:00' }),
    ).toBe(false);
    expect(
      intervalosSobrepoem({ inicio: '19:00', fim: '20:00' }, { inicio: '18:00', fim: '19:00' }),
    ).toBe(false);
  });

  it('outra quadra ou outra data não conflitam', () => {
    const existentes = [reserva()];
    expect(
      haConflitoDeHorario(existentes, {
        quadraId: 2,
        data: '2026-09-20',
        inicio: '19:00',
        fim: '20:00',
      }),
    ).toBe(false);
    expect(
      haConflitoDeHorario(existentes, {
        quadraId: 1,
        data: '2026-09-21',
        inicio: '19:00',
        fim: '20:00',
      }),
    ).toBe(false);
  });

  it('RN09 — reserva cancelada não ocupa o horário', () => {
    const cancelada = reserva({ status: StatusReserva.Cancelada });
    expect(
      haConflitoDeHorario([cancelada], {
        quadraId: 1,
        data: '2026-09-20',
        inicio: '19:00',
        fim: '20:00',
      }),
    ).toBe(false);
  });

  it('RF13 — a própria reserva é ignorada na alteração', () => {
    const alvo = {
      quadraId: 1,
      data: '2026-09-20',
      inicio: '19:30',
      fim: '20:30',
      ignorarReservaId: 1,
    };
    expect(haConflitoDeHorario([reserva()], alvo)).toBe(false);
  });
});

describe('RN07 — valor da reserva', () => {
  it('R$ 80/h × 2h = R$ 160', () => {
    expect(calcularValorReserva(80, 120)).toBe(160);
  });

  it('considera frações de hora (R$ 95/h × 1h30 = R$ 142,50)', () => {
    expect(calcularValorReserva(95, 90)).toBe(142.5);
  });
});

describe('RN08 — cancelamento', () => {
  const r = reserva(); // 20/09 19:00–20:00

  it('cliente cancela com pelo menos 4 horas de antecedência', () => {
    expect(podeCancelarReserva(r, new Date(2026, 8, 20, 10, 0), Perfil.Cliente).permitido).toBe(
      true,
    );
    expect(podeCancelarReserva(r, new Date(2026, 8, 20, 15, 0), Perfil.Cliente).permitido).toBe(
      true,
    );
  });

  it('cliente não cancela a menos de 4 horas do início', () => {
    const resultado = podeCancelarReserva(r, new Date(2026, 8, 20, 15, 1), Perfil.Cliente);
    expect(resultado.permitido).toBe(false);
    expect(resultado.motivo).toMatch(/^RN08/);
  });

  it('administrador cancela a qualquer momento antes do término', () => {
    expect(
      podeCancelarReserva(r, new Date(2026, 8, 20, 18, 30), Perfil.Administrador).permitido,
    ).toBe(true);
    expect(
      podeCancelarReserva(r, new Date(2026, 8, 20, 19, 30), Perfil.Administrador).permitido,
    ).toBe(true);
  });

  it('ninguém cancela reserva já encerrada ou cancelada', () => {
    expect(
      podeCancelarReserva(r, new Date(2026, 8, 20, 20, 0), Perfil.Administrador).permitido,
    ).toBe(false);
    const cancelada = reserva({ status: StatusReserva.Cancelada });
    expect(
      podeCancelarReserva(cancelada, new Date(2026, 8, 19), Perfil.Administrador).permitido,
    ).toBe(false);
  });
});

describe('gerarSlots (RF10)', () => {
  const agora = new Date(2026, 8, 20, 12, 30);
  const motivo = (slots: Slot[], hora: string) => slots.find((s) => s.hora === hora)?.motivo;
  const slots = (parcial: Partial<Parameters<typeof gerarSlots>[0]> = {}) =>
    gerarSlots({
      quadra: quadra(),
      data: '2026-09-20',
      duracaoMinutos: 60,
      ocupados: [],
      agora,
      ...parcial,
    });

  it('quadra em manutenção deixa todos os horários indisponíveis (RN03)', () => {
    const resultado = slots({ quadra: quadra({ status: StatusQuadra.Manutencao }) });
    expect(resultado.every((s) => !s.disponivel && s.motivo === 'quadra-indisponivel')).toBe(true);
  });

  it('horários que já passaram hoje ficam indisponíveis', () => {
    const resultado = slots();
    expect(motivo(resultado, '12:00')).toBe('passado');
    expect(resultado.find((s) => s.hora === '14:00')).toEqual({
      hora: '14:00',
      fim: '15:00',
      disponivel: true,
    });
  });

  it('datas anteriores a hoje e além da janela de 30 dias', () => {
    expect(motivo(slots({ data: '2026-09-19' }), '14:00')).toBe('passado');
    expect(motivo(slots({ data: '2026-10-19' }), '14:00')).toBeUndefined();
    expect(motivo(slots({ data: '2026-10-20' }), '14:00')).toBe('fora-da-janela');
  });

  it('reservas que ultrapassam as 22h', () => {
    const resultado = slots({ duracaoMinutos: 120 });
    expect(motivo(resultado, '20:00')).toBeUndefined();
    expect(motivo(resultado, '21:00')).toBe('fora-do-horario');
  });

  it('horários sobrepostos a reservas existentes', () => {
    const resultado = slots({ duracaoMinutos: 90, ocupados: [{ inicio: '19:00', fim: '20:00' }] });
    expect(motivo(resultado, '18:00')).toBe('ocupado');
    expect(motivo(resultado, '19:00')).toBe('ocupado');
    expect(motivo(resultado, '20:00')).toBeUndefined();
  });
});

describe('validarReserva', () => {
  const agora = new Date(2026, 8, 20, 12, 0);
  const base = {
    quadra: quadra(),
    cliente: { status: StatusCliente.Ativo },
    data: '2026-09-20',
    horaInicio: '14:00',
    duracaoMinutos: 120,
    reservasExistentes: [reserva()],
    agora,
  };

  it('calcula horário final e valor (RN07)', () => {
    expect(validarReserva(base)).toEqual({ horaFim: '16:00', valor: 160 });
  });

  it('rejeita quadra indisponível (RN03), conflito (RN04) e cliente inativo (RN05)', () => {
    expect(() =>
      validarReserva({ ...base, quadra: quadra({ status: StatusQuadra.Manutencao }) }),
    ).toThrow(expect.objectContaining({ regra: 'RN03' }));
    expect(() => validarReserva({ ...base, horaInicio: '18:30', duracaoMinutos: 60 })).toThrow(
      expect.objectContaining({ regra: 'RN04' }),
    );
    expect(() => validarReserva({ ...base, cliente: { status: StatusCliente.Inativo } })).toThrow(
      expect.objectContaining({ regra: 'RN05' }),
    );
  });

  it('rejeita duração fora das opções e horário passado', () => {
    expect(() => validarReserva({ ...base, duracaoMinutos: 45 })).toThrow(/Duração inválida/);
    expect(() => validarReserva({ ...base, horaInicio: '11:00' })).toThrow(/já passou/);
  });
});

describe('statusEfetivoDaReserva', () => {
  it('reserva confirmada cujo horário terminou é Concluída', () => {
    expect(statusEfetivoDaReserva(reserva(), new Date(2026, 8, 20, 20, 0))).toBe(
      StatusReserva.Concluida,
    );
    expect(statusEfetivoDaReserva(reserva(), new Date(2026, 8, 20, 19, 59))).toBe(
      StatusReserva.Confirmada,
    );
    const pendente = reserva({ status: StatusReserva.Pendente });
    expect(statusEfetivoDaReserva(pendente, new Date(2026, 8, 21))).toBe(StatusReserva.Pendente);
  });
});
