import { createAppServices } from '@/core/application/createAppServices';
import type { AppServices } from '@/core/application/services';
import { type AppEnv, env } from '@/config/env';
import { systemClock } from '@/core/infrastructure/clock/SystemClock';
import { createHttpBackend } from '@/core/infrastructure/http/createHttpBackend';
import { createMockBackend } from '@/core/infrastructure/mock';
import { createLocalStorageSessionStore } from '@/core/infrastructure/storage/LocalStorageSessionStore';

/** Composition root: escolhe o backend (simulado ou HTTP) e monta os casos de uso. */
export function createContainer(appEnv: AppEnv = env): AppServices {
  const clock = systemClock;
  const sessionStore = createLocalStorageSessionStore({ clock });
  const backend =
    appEnv.apiMode === 'mock'
      ? createMockBackend({ sessionStore, clock })
      : createHttpBackend({ baseURL: appEnv.apiBaseUrl, sessionStore });
  return createAppServices({ ...backend, sessionStore, clock });
}
