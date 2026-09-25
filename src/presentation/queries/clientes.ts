import { useMutation, useQuery } from '@tanstack/react-query';
import type { AtualizarClienteInput, ClienteFiltro, NovoClienteInput } from '@/application/dto';
import type { StatusCliente } from '@/domain/enums';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys, queryRoots } from './keys';
import { useInvalidate } from './useInvalidate';

export function useClientes(filtro: ClienteFiltro = {}) {
  const { clientes } = useServices();
  return useQuery({ queryKey: queryKeys.clientes(filtro), queryFn: () => clientes.listar(filtro) });
}

export function useCriarCliente() {
  const { clientes } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: NovoClienteInput) => clientes.criar(input),
    onSuccess: () => invalidate(queryRoots.clientes, queryRoots.dashboard),
  });
}

export function useAtualizarCliente() {
  const { clientes } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AtualizarClienteInput }) => clientes.atualizar(id, input),
    onSuccess: () => invalidate(queryRoots.clientes, queryRoots.reservas, queryRoots.pagamentos, queryRoots.dashboard),
  });
}

export function useAlterarStatusCliente() {
  const { clientes } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: StatusCliente }) => clientes.alterarStatus(id, status),
    onSuccess: () => invalidate(queryRoots.clientes, queryRoots.dashboard),
  });
}
