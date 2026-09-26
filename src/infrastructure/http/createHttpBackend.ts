import type { SessionStore } from '@/application/ports';
import type { AdaptadoresBackend } from '@/infrastructure/backend';
import { createHttpAuthGateway } from './HttpAuthGateway';
import { createHttpClient } from './httpClient';
import { createHttpClienteRepository } from './HttpClienteRepository';
import { createHttpPagamentoRepository } from './HttpPagamentoRepository';
import { createHttpQuadraRepository } from './HttpQuadraRepository';
import { createHttpReservaRepository } from './HttpReservaRepository';

/** Adaptadores da API REST ASP.NET Core (docs/api-contract.md). */
export function createHttpBackend(opcoes: {
  baseURL: string;
  sessionStore: SessionStore;
}): AdaptadoresBackend {
  const http = createHttpClient(opcoes);
  return {
    quadraRepository: createHttpQuadraRepository(http),
    clienteRepository: createHttpClienteRepository(http),
    reservaRepository: createHttpReservaRepository(http),
    pagamentoRepository: createHttpPagamentoRepository(http),
    authGateway: createHttpAuthGateway(http),
  };
}
