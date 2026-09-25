import { useMutation, useQuery } from '@tanstack/react-query';
import type { PagamentoFiltro, RegistrarPagamentoInput } from '@/application/dto';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys, queryRoots } from './keys';
import { useInvalidate } from './useInvalidate';

export function usePagamentos(filtro: PagamentoFiltro = {}) {
  const { pagamentos } = useServices();
  return useQuery({ queryKey: queryKeys.pagamentos(filtro), queryFn: () => pagamentos.listar(filtro) });
}

export function useRegistrarPagamento() {
  const { pagamentos } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: RegistrarPagamentoInput) => pagamentos.registrar(input),
    onSuccess: () => invalidate(queryRoots.pagamentos, queryRoots.reservas, queryRoots.dashboard),
  });
}

export function useConfirmarPagamento() {
  const { pagamentos } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => pagamentos.confirmar(id),
    onSuccess: () => invalidate(queryRoots.pagamentos, queryRoots.reservas, queryRoots.dashboard),
  });
}
