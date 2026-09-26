import type { ReservaDetalhada } from '@/application/dto';
import type { Pagamento, Reserva } from '@/domain/entities';
import { StatusPagamento, StatusReserva } from '@/domain/enums';
import { fimDaReserva, inicioDaReserva, statusEfetivoDaReserva } from '@/domain/rules';
import { formatDataCurta, isSameMonth, toISODate } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva, formatDuracao } from '@/shared/lib/format';

/** Linha chave/valor exibida nos diálogos. */
export interface LinhaDetalhe {
  label: string;
  value: string;
}

export interface EstatisticasCliente {
  /** Pendentes/Confirmadas que ainda não começaram. */
  proximasReservas: number;
  /** Reservas não canceladas sem pagamento ou com pagamento Pendente. */
  pagamentosPendentes: number;
  /** Duração somada das reservas já jogadas no mês corrente. */
  minutosJogadosNoMes: number;
}

type ReservaComPagamento = Pick<ReservaDetalhada, 'status' | 'pagamento'>;

function foiJogada(reserva: ReservaDetalhada, agora: Date): boolean {
  return statusEfetivoDaReserva(reserva, agora) === StatusReserva.Concluida;
}

export function pagamentoPendente(reserva: ReservaComPagamento): boolean {
  if (reserva.status === StatusReserva.Cancelada) return false;
  return reserva.pagamento === null || reserva.pagamento.status === StatusPagamento.Pendente;
}

export function calcularEstatisticas(reservas: readonly ReservaDetalhada[], agora: Date): EstatisticasCliente {
  const hoje = toISODate(agora);
  let proximasReservas = 0;
  let pagamentosPendentes = 0;
  let minutosJogadosNoMes = 0;
  for (const reserva of reservas) {
    const ativa = reserva.status === StatusReserva.Pendente || reserva.status === StatusReserva.Confirmada;
    if (ativa && inicioDaReserva(reserva) > agora) proximasReservas += 1;
    if (pagamentoPendente(reserva)) pagamentosPendentes += 1;
    if (isSameMonth(reserva.data, hoje) && foiJogada(reserva, agora)) minutosJogadosNoMes += reserva.duracaoMinutos;
  }
  return { proximasReservas, pagamentosPendentes, minutosJogadosNoMes };
}

/** 150 -> "2h30"; sem jogos -> "0h". */
export function formatHorasJogadas(minutos: number): string {
  return minutos > 0 ? formatDuracao(minutos) : '0h';
}

/**
 * Próximas primeiro (em ordem cronológica, incluindo a que está em andamento),
 * depois as passadas (da mais recente para a mais antiga).
 */
export function ordenarReservas<T extends Pick<Reserva, 'id' | 'data' | 'horaInicio' | 'horaFim'>>(
  reservas: readonly T[],
  agora: Date,
): T[] {
  const instante = (reserva: T) => inicioDaReserva(reserva).getTime();
  const proximas: T[] = [];
  const passadas: T[] = [];
  for (const reserva of reservas) (fimDaReserva(reserva) > agora ? proximas : passadas).push(reserva);
  proximas.sort((a, b) => instante(a) - instante(b) || a.id - b.id);
  passadas.sort((a, b) => instante(b) - instante(a) || b.id - a.id);
  return [...proximas, ...passadas];
}

/** RF14 — a reserva ainda não cancelada e sem pagamento registrado pode ser paga. */
export function podePagar(reserva: ReservaComPagamento): boolean {
  return reserva.status !== StatusReserva.Cancelada && reserva.pagamento === null;
}

/** "19:00–20:00" */
export function formatHorario(reserva: Pick<Reserva, 'horaInicio' | 'horaFim'>): string {
  return `${reserva.horaInicio}–${reserva.horaFim}`;
}

/** "21/09 · 20:00–21:00" */
export function descreverAgendamento(reserva: Pick<Reserva, 'data' | 'horaInicio' | 'horaFim'>): string {
  return `${formatDataCurta(reserva.data)} · ${formatHorario(reserva)}`;
}

/** Ao cancelar: pagamento Pago é estornado; pendente (ou inexistente) é cancelado. */
export function destinoDoPagamentoAoCancelar(pagamento: Pick<Pagamento, 'status'> | null): string {
  return pagamento?.status === StatusPagamento.Pago ? 'Será estornado' : 'Será cancelado';
}

export function linhasCancelamento(reserva: ReservaDetalhada): LinhaDetalhe[] {
  return [
    { label: 'Reserva', value: formatCodigoReserva(reserva.id) },
    { label: 'Quadra', value: reserva.quadra?.nome ?? '—' },
    { label: 'Horário', value: descreverAgendamento(reserva) },
    { label: 'Pagamento', value: destinoDoPagamentoAoCancelar(reserva.pagamento) },
  ];
}

export function linhasPagamento(reserva: ReservaDetalhada): LinhaDetalhe[] {
  return [
    { label: 'Reserva', value: formatCodigoReserva(reserva.id) },
    { label: 'Quadra', value: reserva.quadra?.nome ?? '—' },
    { label: 'Horário', value: descreverAgendamento(reserva) },
    { label: 'Valor', value: formatBRL(reserva.valor) },
  ];
}

/** "Reserva RSV-1043 cancelada — horário liberado" */
export function mensagemReservaCancelada(reservaId: number): string {
  return `Reserva ${formatCodigoReserva(reservaId)} cancelada — horário liberado`;
}

/** Pix/Cartão são aprovados na hora; Dinheiro fica pendente até a confirmação na arena. */
export function mensagemPagamentoRegistrado(pagamento: Pick<Pagamento, 'reservaId' | 'status' | 'valor'>): string {
  const codigo = formatCodigoReserva(pagamento.reservaId);
  return pagamento.status === StatusPagamento.Pago
    ? `Pagamento ${codigo} aprovado — ${formatBRL(pagamento.valor)}`
    : `Pagamento ${codigo} registrado — pague na arena`;
}
