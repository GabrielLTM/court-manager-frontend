import type { ReservaDetalhada } from '@/application/dto';
import type { Cliente, Pagamento, Quadra, Reserva, Sessao } from '@/domain/entities';
import { StatusPagamento } from '@/domain/enums';
import { calcularDuracaoMinutos } from '@/domain/rules';
import { toMinutes } from '@/shared/lib/time';
import type { AppDependencies } from './dependencies';
import { clienteRestrito } from './sessao';

type ClienteResumo = Pick<Cliente, 'id' | 'nome'>;

/** Dados auxiliares usados para enriquecer reservas (join feito na camada de aplicação). */
export interface FontesDeDetalhe {
  quadras: readonly Quadra[];
  pagamentos: readonly Pagamento[];
  clientes: readonly ClienteResumo[];
}

/**
 * Carrega quadras, pagamentos e clientes em paralelo. Para o perfil Cliente, os pagamentos são
 * restritos ao próprio cliente e o "cliente" vem da sessão (a listagem de clientes é do admin).
 */
export async function carregarFontesDeDetalhe(
  deps: Pick<AppDependencies, 'quadraRepository' | 'pagamentoRepository' | 'clienteRepository'>,
  sessao: Sessao | null,
): Promise<FontesDeDetalhe> {
  const clienteId = clienteRestrito(sessao);
  const [quadras, pagamentos, clientes] = await Promise.all([
    deps.quadraRepository.listar(),
    deps.pagamentoRepository.listar(clienteId === undefined ? {} : { clienteId }),
    clienteId === undefined || !sessao
      ? deps.clienteRepository.listar()
      : Promise.resolve([{ id: clienteId, nome: sessao.usuario.nome }]),
  ]);
  return { quadras, pagamentos, clientes };
}

export function criarDetalhador(fontes: FontesDeDetalhe): (reserva: Reserva) => ReservaDetalhada {
  const quadras = new Map(fontes.quadras.map((q) => [q.id, q]));
  const clientes = new Map(fontes.clientes.map((c) => [c.id, { id: c.id, nome: c.nome }]));
  const pagamentos = indexarPagamentoPorReserva(fontes.pagamentos);
  return (reserva) => ({
    ...reserva,
    duracaoMinutos: calcularDuracaoMinutos(reserva.horaInicio, reserva.horaFim),
    quadra: quadras.get(reserva.quadraId) ?? null,
    cliente: clientes.get(reserva.clienteId) ?? null,
    pagamento: pagamentos.get(reserva.id) ?? null,
  });
}

/**
 * RN10 — no máximo um pagamento ativo (Pendente/Pago) por reserva. Se houver histórico
 * (cancelados/estornados), prevalece o ativo; entre iguais, o mais recente.
 */
function indexarPagamentoPorReserva(pagamentos: readonly Pagamento[]): Map<number, Pagamento> {
  const ativo = (p: Pagamento) =>
    p.status === StatusPagamento.Pendente || p.status === StatusPagamento.Pago;
  const indice = new Map<number, Pagamento>();
  for (const pagamento of pagamentos) {
    const atual = indice.get(pagamento.reservaId);
    const prevalece =
      !atual ||
      (ativo(pagamento) && !ativo(atual)) ||
      (ativo(pagamento) === ativo(atual) && pagamento.id > atual.id);
    if (prevalece) indice.set(pagamento.reservaId, pagamento);
  }
  return indice;
}

/** Ordena por data e horário de início (crescente). */
export function compararPorAgenda(a: Reserva, b: Reserva): number {
  return (
    a.data.localeCompare(b.data) || toMinutes(a.horaInicio) - toMinutes(b.horaInicio) || a.id - b.id
  );
}

/** Mais recentes primeiro (data de criação), com desempate pelo id. */
export function compararPorCriacaoDesc(a: Reserva, b: Reserva): number {
  const instante = (r: Reserva) => {
    const ms = Date.parse(r.dataCriacao);
    return Number.isNaN(ms) ? 0 : ms;
  };
  return instante(b) - instante(a) || b.id - a.id;
}
