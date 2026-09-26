import type { Clock, SessionStore } from '@/application/ports';
import type { AdaptadoresBackend } from '@/infrastructure/backend';
import { type Armazenamento, obterLocalStorage } from '@/infrastructure/storage/armazenamento';
import { criarAutorizacao } from './autorizacao';
import { criarBancoMock } from './banco';
import { criarContextoMock } from './contexto';
import { criarAtraso, type Latencia } from './latencia';
import { createMockAuthGateway } from './MockAuthGateway';
import { createMockClienteRepository } from './MockClienteRepository';
import { createMockPagamentoRepository } from './MockPagamentoRepository';
import { createMockQuadraRepository } from './MockQuadraRepository';
import { createMockReservaRepository } from './MockReservaRepository';

export interface OpcoesMockBackend {
  /** Sessão atual: o "servidor" lê dela o token JWT (autorização por perfil). */
  sessionStore: SessionStore;
  clock: Clock;
  /** Latência simulada em ms — número fixo ou intervalo (padrão 150–400 ms). Testes usam 0. */
  latencyMs?: Latencia;
  /** Onde persistir o banco (padrão: localStorage). `null` mantém tudo em memória. */
  storage?: Armazenamento | null;
}

/** Backend simulado no navegador que implementa as mesmas portas da API REST. */
export function createMockBackend(opcoes: OpcoesMockBackend): AdaptadoresBackend {
  const { sessionStore, clock } = opcoes;
  const contexto = criarContextoMock({
    banco: criarBancoMock({
      storage: opcoes.storage === undefined ? obterLocalStorage() : opcoes.storage,
      clock,
    }),
    clock,
    autorizacao: criarAutorizacao(sessionStore, clock),
    aguardar: criarAtraso(opcoes.latencyMs),
  });
  return {
    quadraRepository: createMockQuadraRepository(contexto),
    clienteRepository: createMockClienteRepository(contexto),
    reservaRepository: createMockReservaRepository(contexto),
    pagamentoRepository: createMockPagamentoRepository(contexto),
    authGateway: createMockAuthGateway(contexto),
  };
}
