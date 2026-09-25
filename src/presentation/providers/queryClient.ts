import { QueryClient } from '@tanstack/react-query';
import { isAppError } from '@/application/errors';
import { isDomainError } from '@/domain/errors/DomainError';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isDomainError(error)) return false;
          if (isAppError(error) && error.status !== undefined && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
