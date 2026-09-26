import { createAppServices } from '@/application/createAppServices';
import type { Clock } from '@/application/ports';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import {
  type Armazenamento,
  criarArmazenamentoEmMemoria,
} from '@/infrastructure/storage/armazenamento';
import { createLocalStorageSessionStore } from '@/infrastructure/storage/LocalStorageSessionStore';
import { createMockBackend } from '../createMockBackend';

/** "Hoje" do protótipo: as datas da semente ficam idênticas às do protótipo. */
export const HOJE = '2026-09-20';
export const AMANHA = '2026-09-21';

/** Casos de uso ligados ao backend simulado: latência 0, armazenamento em memória e relógio fixo. */
export function criarAmbiente(
  inicio = new Date(2026, 8, 20, 12, 0),
  storage: Armazenamento | null = null,
) {
  let agora = inicio;
  const clock: Clock = { now: () => new Date(agora) };
  const sessionStore = createLocalStorageSessionStore({
    storage: criarArmazenamentoEmMemoria(),
    clock,
  });
  const backend = createMockBackend({ sessionStore, clock, latencyMs: 0, storage });
  const services = createAppServices({ ...backend, sessionStore, clock });
  return {
    services,
    backend,
    sessionStore,
    definirAgora: (instante: Date) => {
      agora = instante;
    },
    entrarComoCliente: () => services.auth.login(CONTAS_DEMO[Perfil.Cliente]),
    entrarComoAdmin: () => services.auth.login(CONTAS_DEMO[Perfil.Administrador]),
  };
}
