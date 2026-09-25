import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys } from './keys';

export function useResumoDashboard(data: string) {
  const { dashboard } = useServices();
  return useQuery({ queryKey: queryKeys.dashboard(data), queryFn: () => dashboard.obterResumo(data) });
}
