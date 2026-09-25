import type { AppServices } from '@/application/services';
import { createAuthService } from './use-cases/auth';
import { createClienteService } from './use-cases/clientes';
import { createDashboardService } from './use-cases/dashboard';
import type { AppDependencies } from './use-cases/dependencies';
import { createPagamentoService } from './use-cases/pagamentos';
import { createPerfilService } from './use-cases/perfil';
import { createQuadraService } from './use-cases/quadras';
import { createReservaService } from './use-cases/reservas';

export type { AppDependencies } from './use-cases/dependencies';

/**
 * Monta a fachada de casos de uso a partir das portas. Os métodos são closures (não dependem de
 * `this`), então podem ser desestruturados pela camada de apresentação.
 */
export function createAppServices(deps: AppDependencies): AppServices {
  return {
    auth: createAuthService(deps),
    perfil: createPerfilService(deps),
    quadras: createQuadraService(deps),
    clientes: createClienteService(deps),
    reservas: createReservaService(deps),
    pagamentos: createPagamentoService(deps),
    dashboard: createDashboardService(deps),
    clock: deps.clock,
  };
}
