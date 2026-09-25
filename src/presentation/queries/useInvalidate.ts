import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/** Invalida várias raízes de cache de uma vez (após mutações). */
export function useInvalidate() {
  const queryClient = useQueryClient();
  return useCallback(
    (...roots: ReadonlyArray<readonly unknown[]>) =>
      Promise.all(roots.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
    [queryClient],
  );
}
