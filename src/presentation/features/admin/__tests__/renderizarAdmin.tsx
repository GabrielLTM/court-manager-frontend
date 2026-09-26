import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { AppServices } from '@/application/services';
import type { Sessao } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { AppProviders } from '@/presentation/providers/AppProviders';

const SESSAO_ADMIN: Sessao = {
  token: 'token',
  usuario: { id: 1, nome: 'Gabriel Lessa', email: 'admin@arena.com', perfil: Perfil.Administrador, clienteId: null },
  expiraEm: null,
};

/** "Agora" dos testes: 20/09/2026 às 10:00 (o "hoje" do protótipo). */
export const AGORA_TESTE = new Date(2026, 8, 20, 10, 0);

type ServicosParciais = { [K in keyof AppServices]?: Partial<AppServices[K]> };

/** Renderiza uma página do admin com os providers reais e serviços simulados. */
export function renderizarAdmin(ui: ReactElement, servicos: ServicosParciais = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const services = {
    auth: {
      sessaoAtual: () => SESSAO_ADMIN,
      subscribe: () => () => {},
      login: async () => SESSAO_ADMIN,
      registrar: async () => SESSAO_ADMIN,
      logout: () => {},
    },
    clock: { now: () => new Date(AGORA_TESTE) },
    ...servicos,
  } as unknown as AppServices;

  return render(
    <AppProviders services={services} queryClient={queryClient}>
      {ui}
    </AppProviders>,
  );
}
