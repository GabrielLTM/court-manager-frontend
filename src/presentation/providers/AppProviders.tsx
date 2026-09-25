import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { AppServices } from '@/application/services';
import { AuthProvider } from './AuthProvider';
import { ServicesProvider } from './ServicesProvider';
import { ToastProvider } from './ToastProvider';

interface AppProvidersProps {
  services: AppServices;
  queryClient: QueryClient;
  children: ReactNode;
}

/** Composição de providers: DI → React Query → Toast → Autenticação. */
export function AppProviders({ services, queryClient, children }: AppProvidersProps) {
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
