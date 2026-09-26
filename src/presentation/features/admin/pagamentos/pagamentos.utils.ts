import type { Pagamento } from '@/domain/entities';
import { StatusPagamento } from '@/domain/enums';
import type { FiltroOpcao } from '@/presentation/features/admin/shared/FiltroPills';

export type FiltroPagamento = 'todos' | 'pendentes' | 'pagos' | 'cancelados' | 'estornados';

export const FILTROS_PAGAMENTO: ReadonlyArray<FiltroOpcao<FiltroPagamento>> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'cancelados', label: 'Cancelados' },
  { value: 'estornados', label: 'Estornados' },
];

const STATUS_DO_FILTRO: Record<Exclude<FiltroPagamento, 'todos'>, StatusPagamento> = {
  pendentes: StatusPagamento.Pendente,
  pagos: StatusPagamento.Pago,
  cancelados: StatusPagamento.Cancelado,
  estornados: StatusPagamento.Estornado,
};

export function filtrarPagamentos<T extends Pick<Pagamento, 'status'>>(
  pagamentos: readonly T[],
  filtro: FiltroPagamento,
): T[] {
  if (filtro === 'todos') return [...pagamentos];
  return pagamentos.filter((p) => p.status === STATUS_DO_FILTRO[filtro]);
}

export interface Totalizador {
  total: number;
  quantidade: number;
}

export interface ResumoPagamentos {
  recebido: Totalizador;
  aReceber: Totalizador;
  estornado: Totalizador;
}

function totalizar(pagamentos: readonly Pick<Pagamento, 'status' | 'valor'>[], status: StatusPagamento): Totalizador {
  const doStatus = pagamentos.filter((p) => p.status === status);
  const centavos = doStatus.reduce((soma, p) => soma + Math.round(p.valor * 100), 0);
  return { total: centavos / 100, quantidade: doStatus.length };
}

/** Totais dos cartões do topo: Recebido (Pago), A receber (Pendente) e Estornado. */
export function resumirPagamentos(pagamentos: readonly Pick<Pagamento, 'status' | 'valor'>[]): ResumoPagamentos {
  return {
    recebido: totalizar(pagamentos, StatusPagamento.Pago),
    aReceber: totalizar(pagamentos, StatusPagamento.Pendente),
    estornado: totalizar(pagamentos, StatusPagamento.Estornado),
  };
}

/** 0 -> "nenhum pagamento", 1 -> "1 pagamento", 3 -> "3 pagamentos". */
export function descreverQuantidade(quantidade: number): string {
  if (quantidade === 0) return 'nenhum pagamento';
  return `${quantidade} ${quantidade === 1 ? 'pagamento' : 'pagamentos'}`;
}
