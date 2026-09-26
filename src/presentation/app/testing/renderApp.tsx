import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import type { AppServices } from '@/application/services';
import { AppProviders } from '@/presentation/providers/AppProviders';
import { appRoutes } from '../router';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** O jsdom não implementa window.scrollTo (usado pelo ScrollRestoration). */
function silenciarScrollTo() {
  if (!vi.isMockFunction(window.scrollTo))
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
}

/** Renderiza a aplicação inteira (providers + rotas reais) em um roteador de memória. */
export function renderAppAt(path: string, services: AppServices) {
  silenciarScrollTo();
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(
    <AppProviders services={services} queryClient={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, router, user };
}

/** Renderiza um trecho de UI com os providers (sem roteador). */
export function renderWithProviders(ui: ReactNode, services: AppServices) {
  const user = userEvent.setup();
  const view = render(
    <AppProviders services={services} queryClient={createTestQueryClient()}>
      {ui}
    </AppProviders>,
  );
  return { ...view, user };
}
