import type { Pagamento, Reserva } from '@/domain/entities';
import { METODO_PAGAMENTO_LABEL, STATUS_PAGAMENTO_LABEL } from '@/domain/enums';
import { formatDataCurta, formatDataLonga } from '@/shared/lib/date';

type PeriodoReserva = Pick<Reserva, 'data' | 'horaInicio' | 'horaFim'>;

/** "20/09 · 19:00" — início da reserva (tabela de reservas recentes). */
export function formatInicioReserva(reserva: Pick<Reserva, 'data' | 'horaInicio'>): string {
  return `${formatDataCurta(reserva.data)} · ${reserva.horaInicio}`;
}

/** "20/09 · 19:00–20:00" */
export function formatPeriodoReserva(reserva: PeriodoReserva): string {
  return `${formatDataCurta(reserva.data)} · ${reserva.horaInicio}–${reserva.horaFim}`;
}

/** "20/09/2026 · 19:00–20:00" (recibo). */
export function formatPeriodoReservaCompleto(reserva: PeriodoReserva): string {
  return `${formatDataLonga(reserva.data)} · ${reserva.horaInicio}–${reserva.horaFim}`;
}

/** "Pix · Pago" ou "Não registrado" quando a reserva ainda não tem pagamento. */
export function descreverPagamento(pagamento: Pick<Pagamento, 'metodo' | 'status'> | null | undefined): string {
  if (!pagamento) return 'Não registrado';
  return `${METODO_PAGAMENTO_LABEL[pagamento.metodo]} · ${STATUS_PAGAMENTO_LABEL[pagamento.status]}`;
}

/** 1 -> "1 reserva", 3 -> "3 reservas". */
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/** Normaliza texto para busca: sem acentos, minúsculo e sem espaços nas pontas. */
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
