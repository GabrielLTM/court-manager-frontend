import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getErrorMessage } from '@/presentation/lib/errors';
import { ErrorState, LoadingState } from './States';

export interface AsyncContentProps<T> {
  query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError' | 'error' | 'refetch'>;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/** Renderiza carregando / erro (com "Tentar novamente") / conteúdo de uma query. */
export function AsyncContent<T>({ query, loadingLabel, children }: AsyncContentProps<T>) {
  if (query.isPending) return <LoadingState label={loadingLabel} />;
  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  return <>{children(query.data as T)}</>;
}
