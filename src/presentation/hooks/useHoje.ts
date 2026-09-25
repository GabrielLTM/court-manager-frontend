import { useServices } from '@/presentation/providers/ServicesContext';
import { toISODate } from '@/shared/lib/date';

/** Data de hoje (ISO) e o instante atual, a partir do Clock injetado. */
export function useHoje(): { hoje: string; agora: Date } {
  const { clock } = useServices();
  const agora = clock.now();
  return { hoje: toISODate(agora), agora };
}
