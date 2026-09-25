/** Utilitários de horário no formato "HH:mm" (equivalente ao TimeOnly do backend). */
const pad = (n: number) => String(n).padStart(2, '0');

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function addMinutes(hhmm: string, minutes: number): string {
  return fromMinutes(toMinutes(hhmm) + minutes);
}

/** Normaliza "19:00:00" (TimeOnly serializado) para "19:00". */
export function normalizeTime(value: string): string {
  const [h = '00', m = '00'] = value.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}
