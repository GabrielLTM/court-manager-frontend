import { useMutation, useQuery } from '@tanstack/react-query';
import type { AtualizarPerfilInput } from '@/application/dto';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys, queryRoots } from './keys';
import { useInvalidate } from './useInvalidate';

export function usePerfil() {
  const { perfil } = useServices();
  return useQuery({ queryKey: queryKeys.perfil(), queryFn: () => perfil.obter() });
}

export function useAtualizarPerfil() {
  const { perfil } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: AtualizarPerfilInput) => perfil.atualizar(input),
    onSuccess: () => invalidate(queryRoots.perfil, queryRoots.reservas),
  });
}
