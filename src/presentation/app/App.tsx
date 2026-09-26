import type { QueryClient } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import type { AppServices } from '@/application/services';
import { AppProviders } from '@/presentation/providers/AppProviders';
import { createAppRouter } from './router';

export interface AppProps {
  services: AppServices;
  queryClient: QueryClient;
}

/** Criado uma única vez por carregamento da página (fora do ciclo de renderização). */
const router = createAppRouter();

export function App({ services, queryClient }: AppProps) {
  return (
    <AppProviders services={services} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
