import { StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';
import { REGRAS_RESERVA } from '@/domain/rules';
import { QUADRAS_PROTOTIPO, umPagamento, umaQuadra, umaReserva } from '../../__tests__/fixtures';
import {
  contarReservasAtivas,
  montarGrade,
  reservaCobreHorario,
  rotuloIndisponibilidade,
  type CelulaGrade,
  type LinhaGrade,
} from '../grade.utils';

const DATA = '2026-09-20';

function celula(linhas: LinhaGrade[], hora: string, quadraId: number): CelulaGrade {
  const linha = linhas.find((l) => l.hora === hora);
  const encontrada = linha?.celulas.find((c) => c.quadra.id === quadraId);
  if (!encontrada) throw new Error(`Célula ${hora}/${quadraId} não encontrada`);
  return encontrada;
}

describe('reservaCobreHorario', () => {
  it('considera o intervalo [início, fim)', () => {
    const r = { horaInicio: '18:00', horaFim: '19:30' };
    expect(reservaCobreHorario(r, '18:00')).toBe(true);
    expect(reservaCobreHorario(r, '19:00')).toBe(true);
    expect(reservaCobreHorario(r, '19:30')).toBe(false);
    expect(reservaCobreHorario(r, '17:00')).toBe(false);
    expect(reservaCobreHorario({ horaInicio: '19:00', horaFim: '20:00' }, '20:00')).toBe(false);
  });
});

describe('rotuloIndisponibilidade', () => {
  it('descreve manutenção e inativação', () => {
    expect(rotuloIndisponibilidade(StatusQuadra.Manutencao)).toBe('manutenção');
    expect(rotuloIndisponibilidade(StatusQuadra.Inativa)).toBe('inativa');
  });
});

describe('montarGrade', () => {
  it('gera uma linha por horário de início e uma célula por quadra, na ordem recebida', () => {
    const linhas = montarGrade({ quadras: QUADRAS_PROTOTIPO, reservas: [], data: DATA });
    expect(linhas.map((l) => l.hora)).toEqual(REGRAS_RESERVA.horariosInicio);
    for (const linha of linhas) {
      expect(linha.celulas.map((c) => c.quadra.id)).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('marca horários livres com a mensagem do toast', () => {
    const linhas = montarGrade({ quadras: QUADRAS_PROTOTIPO, reservas: [], data: DATA });
    expect(celula(linhas, '19:00', 1)).toMatchObject({
      tipo: 'livre',
      rotulo: '',
      mensagem: 'Livre — Quadra 01 às 19:00',
      descricao: 'Quadra 01 às 19:00 — livre',
    });
  });

  it('hachura quadras em manutenção ou inativas, mesmo que tenham reservas', () => {
    const reservaNaManutencao = umaReserva({ id: 2000, quadraId: 2, quadra: QUADRAS_PROTOTIPO[1] });
    const linhas = montarGrade({ quadras: QUADRAS_PROTOTIPO, reservas: [reservaNaManutencao], data: DATA });
    expect(celula(linhas, '19:00', 2)).toMatchObject({
      tipo: 'indisponivel',
      rotulo: '—',
      mensagem: 'Quadra 02 — manutenção',
    });
    expect(celula(linhas, '07:00', 6)).toMatchObject({ tipo: 'indisponivel', mensagem: 'Quadra 06 — inativa' });
  });

  it('preenche todas as linhas cobertas pela reserva com o primeiro nome do cliente', () => {
    const r = umaReserva({ id: 1048, quadraId: 3, horaInicio: '18:00', horaFim: '19:30', duracaoMinutos: 90 });
    const linhas = montarGrade({ quadras: QUADRAS_PROTOTIPO, reservas: [r], data: DATA });

    const as18 = celula(linhas, '18:00', 3);
    expect(as18).toMatchObject({ tipo: 'reservada', rotulo: 'Isadora', pago: true });
    expect(as18.tipo === 'reservada' && as18.reserva).toBe(r);
    expect(as18.descricao).toBe('Quadra 03 às 18:00 — Isadora Oliveira, pago');
    expect(celula(linhas, '19:00', 3)).toMatchObject({ tipo: 'reservada', rotulo: 'Isadora' });
    expect(celula(linhas, '20:00', 3).tipo).toBe('livre');
    expect(celula(linhas, '18:00', 1).tipo).toBe('livre');
  });

  it('diferencia pagamento pago de pendente ou não registrado', () => {
    const pendente = umaReserva({
      id: 1044,
      horaInicio: '10:00',
      horaFim: '11:00',
      pagamento: umPagamento({ status: StatusPagamento.Pendente }),
    });
    const semPagamento = umaReserva({ id: 1060, horaInicio: '15:00', horaFim: '16:00', pagamento: null });
    const linhas = montarGrade({ quadras: [umaQuadra()], reservas: [pendente, semPagamento], data: DATA });

    expect(celula(linhas, '10:00', 1)).toMatchObject({ tipo: 'reservada', pago: false });
    expect(celula(linhas, '10:00', 1).descricao).toContain('pagamento pendente');
    expect(celula(linhas, '15:00', 1)).toMatchObject({ tipo: 'reservada', pago: false });
  });

  it('ignora reservas canceladas (RN09) e de outras datas', () => {
    const cancelada = umaReserva({ status: StatusReserva.Cancelada });
    const amanha = umaReserva({ id: 1043, data: '2026-09-21' });
    const linhas = montarGrade({ quadras: [umaQuadra()], reservas: [cancelada, amanha], data: DATA });
    expect(celula(linhas, '19:00', 1).tipo).toBe('livre');
  });

  it('usa o código da reserva quando o cliente não é conhecido', () => {
    const linhas = montarGrade({ quadras: [umaQuadra()], reservas: [umaReserva({ cliente: null })], data: DATA });
    expect(celula(linhas, '19:00', 1).rotulo).toBe('RSV-1041');
  });
});

describe('contarReservasAtivas', () => {
  it('conta apenas reservas não canceladas da data', () => {
    const reservas = [
      umaReserva(),
      umaReserva({ id: 1042, status: StatusReserva.Pendente }),
      umaReserva({ id: 1055, status: StatusReserva.Cancelada }),
      umaReserva({ id: 1043, data: '2026-09-21' }),
    ];
    expect(contarReservasAtivas(reservas, DATA)).toBe(2);
  });
});
