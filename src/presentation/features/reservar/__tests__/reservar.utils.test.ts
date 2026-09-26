import { ajudaMetodoPagamento } from '@/presentation/components/MetodoPagamentoPicker/ajudaMetodoPagamento';
import type { Quadra, Slot } from '@/domain/entities';
import { MetodoPagamento, StatusQuadra } from '@/domain/enums';
import {
  descreverHorario,
  horarioSelecionavel,
  linhasConfirmacao,
  linhasResumo,
  mensagemReservaCriada,
  montarNovaReserva,
  primeiraQuadraAtiva,
  resolverQuadra,
  selecaoInicial,
  selecaoReducer,
  totalDaReserva,
  type SelecaoReserva,
} from '../reservar.utils';

const quadra = (id: number, status: StatusQuadra, valorHora = 80): Quadra => ({
  id,
  nome: `Quadra 0${id}`,
  tipo: 'Beach Tennis',
  valorHora,
  status,
});

const manutencao = quadra(2, StatusQuadra.Manutencao);
const ativa = quadra(3, StatusQuadra.Ativa, 90);
const inativa = quadra(6, StatusQuadra.Inativa);

const base: SelecaoReserva = { data: '2026-09-20', quadraId: 1, duracaoMinutos: 60, horaInicio: '19:00' };

describe('selecaoInicial', () => {
  it('começa hoje, na primeira quadra ativa, com 1 hora e sem horário', () => {
    expect(selecaoInicial('2026-09-20', [manutencao, ativa, inativa])).toEqual({
      data: '2026-09-20',
      quadraId: 3,
      duracaoMinutos: 60,
      horaInicio: null,
    });
  });

  it('fica sem quadra quando nenhuma pode ser reservada (RN03)', () => {
    expect(selecaoInicial('2026-09-20', [manutencao, inativa]).quadraId).toBeNull();
    expect(primeiraQuadraAtiva([])).toBeNull();
  });
});

describe('selecaoReducer', () => {
  it('limpa o horário ao trocar data, quadra ou duração', () => {
    expect(selecaoReducer(base, { tipo: 'data', data: '2026-09-21' })).toEqual({
      ...base,
      data: '2026-09-21',
      horaInicio: null,
    });
    expect(selecaoReducer(base, { tipo: 'quadra', quadraId: 3 })).toEqual({ ...base, quadraId: 3, horaInicio: null });
    expect(selecaoReducer(base, { tipo: 'duracao', duracaoMinutos: 90 })).toEqual({
      ...base,
      duracaoMinutos: 90,
      horaInicio: null,
    });
  });

  it('mantém o estado ao repetir a mesma escolha', () => {
    expect(selecaoReducer(base, { tipo: 'data', data: base.data })).toBe(base);
    expect(selecaoReducer(base, { tipo: 'quadra', quadraId: 1 })).toBe(base);
    expect(selecaoReducer(base, { tipo: 'duracao', duracaoMinutos: 60 })).toBe(base);
    expect(selecaoReducer(base, { tipo: 'horario', horaInicio: '19:00' })).toBe(base);
  });

  it('escolhe e limpa o horário', () => {
    expect(selecaoReducer(base, { tipo: 'horario', horaInicio: '08:00' }).horaInicio).toBe('08:00');
    expect(selecaoReducer(base, { tipo: 'horario', horaInicio: null }).horaInicio).toBeNull();
  });
});

describe('resolverQuadra', () => {
  it('usa a quadra escolhida ou volta para a primeira ativa', () => {
    const quadras = [manutencao, ativa];
    expect(resolverQuadra(quadras, 2)).toBe(manutencao);
    expect(resolverQuadra(quadras, 99)).toBe(ativa);
    expect(resolverQuadra(quadras, null)).toBe(ativa);
    expect(resolverQuadra([inativa], null)).toBeNull();
  });
});

describe('horarioSelecionavel', () => {
  const slots: Slot[] = [
    { hora: '18:00', fim: '19:00', disponivel: true },
    { hora: '19:00', fim: '20:00', disponivel: false, motivo: 'ocupado' },
  ];

  it('só aceita horários livres da grade atual', () => {
    expect(horarioSelecionavel(slots, '18:00')).toBe('18:00');
    expect(horarioSelecionavel(slots, '19:00')).toBeNull();
    expect(horarioSelecionavel(slots, '21:00')).toBeNull();
    expect(horarioSelecionavel(null, '18:00')).toBeNull();
    expect(horarioSelecionavel(slots, null)).toBeNull();
  });
});

describe('resumo e confirmação', () => {
  it('descreve o intervalo a partir da duração', () => {
    expect(descreverHorario('19:00', 60)).toBe('19:00–20:00');
    expect(descreverHorario('19:00', 90)).toBe('19:00–20:30');
    expect(descreverHorario(null, 60)).toBe('Selecione um horário');
  });

  it('calcula o total pela RN07', () => {
    expect(totalDaReserva(ativa, 120)).toBe('R$ 180,00');
    expect(totalDaReserva(quadra(5, StatusQuadra.Ativa, 95), 90)).toBe('R$ 142,50');
    expect(totalDaReserva(null, 60)).toBe('—');
  });

  it('monta as linhas do card de resumo', () => {
    expect(linhasResumo({ quadra: ativa, data: '2026-09-20', horaInicio: '08:00', duracaoMinutos: 90 })).toEqual([
      { label: 'Data', value: '20/09/2026' },
      { label: 'Horário', value: '08:00–09:30' },
      { label: 'Duração', value: '1h30' },
      { label: 'Valor por hora', value: 'R$ 90,00' },
    ]);
    const semHorario = linhasResumo({ quadra: null, data: '2026-09-21', horaInicio: null, duracaoMinutos: 120 });
    expect(semHorario.map((l) => l.value)).toEqual(['21/09/2026', 'Selecione um horário', '2h', '—']);
  });

  it('monta as linhas do diálogo de confirmação', () => {
    const pendente = { quadra: quadra(1, StatusQuadra.Ativa), data: '2026-09-20', horaInicio: '19:00', duracaoMinutos: 60 };
    expect(linhasConfirmacao(pendente)).toEqual([
      { label: 'Quadra', value: 'Quadra 01 · Beach Tennis' },
      { label: 'Data', value: '20/09/2026' },
      { label: 'Horário', value: '19:00–20:00' },
      { label: 'Total', value: 'R$ 80,00' },
    ]);
  });
});

describe('pagamento e envio', () => {
  it('explica o pagamento simulado de cada método', () => {
    expect(ajudaMetodoPagamento(MetodoPagamento.Pix)).toBe('Pagamento simulado — aprovado na hora.');
    expect(ajudaMetodoPagamento(MetodoPagamento.Cartao)).toBe('Pagamento simulado — aprovado na hora.');
    expect(ajudaMetodoPagamento(MetodoPagamento.Dinheiro)).toBe(
      'Pague na arena; o administrador confirma o recebimento.',
    );
  });

  it('monta a entrada do caso de uso de reserva', () => {
    const pendente = { quadra: ativa, data: '2026-09-22', horaInicio: '18:00', duracaoMinutos: 120 };
    expect(montarNovaReserva(pendente, 1, MetodoPagamento.Dinheiro)).toEqual({
      clienteId: 1,
      quadraId: 3,
      data: '2026-09-22',
      horaInicio: '18:00',
      duracaoMinutos: 120,
      metodoPagamento: MetodoPagamento.Dinheiro,
    });
  });

  it('formata a mensagem de sucesso', () => {
    expect(mensagemReservaCriada({ id: 1048, valor: 80 })).toBe('Reserva RSV-1048 criada — R$ 80,00');
  });
});
