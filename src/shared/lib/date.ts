/**
 * Utilitários de data de calendário. Datas trafegam como strings ISO "YYYY-MM-DD"
 * (equivalente ao DateOnly do backend) e são sempre interpretadas no fuso local.
 */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export const DIAS_SEMANA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;
export const DIAS_SEMANA_INICIAL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
export const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;
export const MESES_LONGO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISODate(value).getTime());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Diferença em dias de calendário: a - b. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / 86_400_000);
}

/** Combina data ISO + horário "HH:mm" em um Date local. */
export function combineDateTime(data: ISODate, hora: string): Date {
  const d = parseISODate(data);
  const [h, m] = hora.split(':').map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/** Primeiro dia do mês da data informada ("YYYY-MM-01"). */
export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseISODate(startOfMonth(iso));
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

export function daysInMonth(iso: ISODate): number {
  const d = parseISODate(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** "20/09" */
export function formatDataCurta(iso: ISODate): string {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}`;
}

/** "20/09/2026" */
export function formatDataLonga(iso: ISODate): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** "20/09/2026 18:42" a partir de um ISO date-time. */
export function formatDataHora(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDataLonga(toISODate(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "seg" */
export function diaDaSemanaCurto(iso: ISODate): string {
  return DIAS_SEMANA_CURTO[parseISODate(iso).getDay()];
}

/** "Setembro 2026" */
export function formatMesAno(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${MESES_LONGO[d.getMonth()]} ${d.getFullYear()}`;
}
