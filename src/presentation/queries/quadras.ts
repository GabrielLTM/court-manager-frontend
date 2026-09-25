import { useMutation, useQuery } from '@tanstack/react-query';
import type { QuadraInput } from '@/application/dto';
import type { StatusQuadra } from '@/domain/enums';
import { useServices } from '@/presentation/providers/ServicesContext';
import { queryKeys, queryRoots } from './keys';
import { useInvalidate } from './useInvalidate';

export function useQuadras() {
  const { quadras } = useServices();
  return useQuery({ queryKey: queryKeys.quadras(), queryFn: () => quadras.listar() });
}

/** GET /api/quadras/{id}/disponibilidade — desabilitada enquanto não houver quadra selecionada. */
export function useDisponibilidade(quadraId: number | null | undefined, data: string) {
  const { quadras } = useServices();
  return useQuery({
    queryKey: queryKeys.disponibilidade(quadraId ?? 0, data),
    queryFn: () => quadras.consultarDisponibilidade(quadraId as number, data),
    enabled: typeof quadraId === 'number' && quadraId > 0,
    staleTime: 10_000,
  });
}

export function useCriarQuadra() {
  const { quadras } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: QuadraInput) => quadras.criar(input),
    onSuccess: () => invalidate(queryRoots.quadras, queryRoots.dashboard),
  });
}

export function useAtualizarQuadra() {
  const { quadras } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: QuadraInput }) => quadras.atualizar(id, input),
    onSuccess: () => invalidate(queryRoots.quadras, queryRoots.disponibilidade, queryRoots.dashboard),
  });
}

export function useAlterarStatusQuadra() {
  const { quadras } = useServices();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: StatusQuadra }) => quadras.alterarStatus(id, status),
    onSuccess: () => invalidate(queryRoots.quadras, queryRoots.disponibilidade, queryRoots.dashboard),
  });
}
