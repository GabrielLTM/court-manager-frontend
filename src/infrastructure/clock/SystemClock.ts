import type { Clock } from '@/application/ports';

/** Relógio do sistema (horário local do navegador). */
export const systemClock: Clock = { now: () => new Date() };
