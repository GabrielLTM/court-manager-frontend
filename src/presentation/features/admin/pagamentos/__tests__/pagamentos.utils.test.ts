import { StatusPagamento } from '@/domain/enums';
import { descreverQuantidade, filtrarPagamentos, resumirPagamentos } from '../pagamentos.utils';

const PAGAMENTOS = [
  { id: 1, status: StatusPagamento.Pago, valor: 80 },
  { id: 2, status: StatusPagamento.Pago, valor: 142.5 },
  { id: 3, status: StatusPagamento.Pendente, valor: 70 },
  { id: 4, status: StatusPagamento.Cancelado, valor: 90 },
  { id: 5, status: StatusPagamento.Estornado, valor: 80 },
  { id: 6, status: StatusPagamento.Pago, valor: 0.1 },
  { id: 7, status: StatusPagamento.Pago, valor: 0.2 },
];

describe('filtrarPagamentos', () => {
  it('filtra por status', () => {
    const ids = (filtro: Parameters<typeof filtrarPagamentos>[1]) =>
      filtrarPagamentos(PAGAMENTOS, filtro).map((p) => p.id);
    expect(ids('todos')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(ids('pendentes')).toEqual([3]);
    expect(ids('pagos')).toEqual([1, 2, 6, 7]);
    expect(ids('cancelados')).toEqual([4]);
    expect(ids('estornados')).toEqual([5]);
  });
});

describe('resumirPagamentos', () => {
  it('soma recebido, a receber e estornado sem erros de arredondamento', () => {
    expect(resumirPagamentos(PAGAMENTOS)).toEqual({
      recebido: { total: 222.8, quantidade: 4 },
      aReceber: { total: 70, quantidade: 1 },
      estornado: { total: 80, quantidade: 1 },
    });
  });

  it('zera os totais sem pagamentos', () => {
    expect(resumirPagamentos([]).recebido).toEqual({ total: 0, quantidade: 0 });
  });
});

describe('descreverQuantidade', () => {
  it('descreve a quantidade de pagamentos', () => {
    expect(descreverQuantidade(0)).toBe('nenhum pagamento');
    expect(descreverQuantidade(1)).toBe('1 pagamento');
    expect(descreverQuantidade(3)).toBe('3 pagamentos');
  });
});
