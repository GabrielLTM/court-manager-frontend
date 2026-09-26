import { StatusQuadra } from '@/domain/enums';
import { QUADRAS_PROTOTIPO, umaQuadra } from '../../__tests__/fixtures';
import {
  ACOES_STATUS_QUADRA,
  formParaQuadraInput,
  formatValorHoraInput,
  mensagemStatusQuadra,
  quadraParaForm,
  sugerirNomeQuadra,
} from '../quadras.utils';

describe('ações de status da quadra', () => {
  it('seguem a ordem Ativar / Manutenção / Inativar', () => {
    expect(ACOES_STATUS_QUADRA.map((a) => a.rotulo)).toEqual(['Ativar', 'Manutenção', 'Inativar']);
  });

  it('geram as mensagens de confirmação', () => {
    expect(mensagemStatusQuadra('Quadra 02', StatusQuadra.Manutencao)).toBe('Quadra 02 — em manutenção');
    expect(mensagemStatusQuadra('Quadra 01', StatusQuadra.Ativa)).toBe('Quadra 01 — ativada');
    expect(mensagemStatusQuadra('Quadra 06', StatusQuadra.Inativa)).toBe('Quadra 06 — inativada');
  });
});

describe('formulário de quadra', () => {
  it('formata o valor por hora no padrão brasileiro', () => {
    expect(formatValorHoraInput(80)).toBe('80,00');
    expect(formatValorHoraInput(142.5)).toBe('142,50');
  });

  it('preenche valores iniciais para cadastro e edição', () => {
    expect(quadraParaForm(null)).toEqual({ nome: '', tipo: '', valorHora: '', status: '1' });
    expect(quadraParaForm(umaQuadra({ valorHora: 95, status: StatusQuadra.Manutencao }))).toEqual({
      nome: 'Quadra 01',
      tipo: 'Beach Tennis',
      valorHora: '95,00',
      status: '3',
    });
  });

  it('converte os valores do formulário no DTO da API', () => {
    expect(formParaQuadraInput({ nome: ' Quadra 07 ', tipo: 'Futevôlei ', valorHora: '75,50', status: '2' })).toEqual({
      nome: 'Quadra 07',
      tipo: 'Futevôlei',
      valorHora: 75.5,
      status: StatusQuadra.Inativa,
    });
  });
});

describe('sugerirNomeQuadra', () => {
  it('sugere o próximo número disponível', () => {
    expect(sugerirNomeQuadra(QUADRAS_PROTOTIPO)).toBe('Quadra 07');
    expect(sugerirNomeQuadra([{ nome: 'Quadra 9' }])).toBe('Quadra 10');
    expect(sugerirNomeQuadra([])).toBe('Quadra 01');
    expect(sugerirNomeQuadra([{ nome: 'Central' }])).toBe('Quadra 02');
  });
});
