import { useMutation, useQuery } from '@tanstack/react-query';
import type { AlterarReservaInput, NovaReservaInput, ReservaFiltro } from '@/application/dto';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys, queryRoots } from './keys';
import { useInvalidate } from './useInvalidate';

/** Reservas detalhadas (com quadra, cliente e pagamento). Para o Cliente, só as próprias. */
export function useReservas(filtro: ReservaFiltro = {}, options: { enabled?: boolean } = {}) {
  const { reservas } = useServices();
  return useQuery({
    queryKey: queryKeys.reservas(filtro),
    queryFn: () => reservas.listar(filtro),
    enabled: options.enabled ?? true,
  });
}

function useInvalidarReservas() {
  const invalidate = useInvalidate();
  return () =>
    invalidate(queryRoots.reservas, queryRoots.pagamentos, queryRoots.disponibilidade, queryRoots.dashboard);
}

export function useCriarReserva() {
  const { reservas } = useServices();
  const invalidar = useInvalidarReservas();
  return useMutation({
    mutationFn: (input: NovaReservaInput) => reservas.criar(input),
    onSettled: invalidar,
  });
}

export function useAlterarReserva() {
  const { reservas } = useServices();
  const invalidar = useInvalidarReservas();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AlterarReservaInput }) => reservas.alterar(id, input),
    onSuccess: invalidar,
  });
}

export function useCancelarReserva() {
  const { reservas } = useServices();
  const invalidar = useInvalidarReservas();
  return useMutation({
    mutationFn: (id: number) => reservas.cancelar(id),
    onSuccess: invalidar,
  });
}
