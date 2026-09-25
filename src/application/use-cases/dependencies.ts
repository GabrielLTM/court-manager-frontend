import type {
  AuthGateway,
  ClienteRepository,
  Clock,
  PagamentoRepository,
  QuadraRepository,
  ReservaRepository,
  SessionStore,
} from '@/application/ports';

/** Portas injetadas nos casos de uso pelo composition root (src/di). */
export interface AppDependencies {
  quadraRepository: QuadraRepository;
  clienteRepository: ClienteRepository;
  reservaRepository: ReservaRepository;
  pagamentoRepository: PagamentoRepository;
  authGateway: AuthGateway;
  sessionStore: SessionStore;
  clock: Clock;
}
