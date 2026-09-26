import type { AppDependencies } from '@/application/createAppServices';

/** Adaptadores de dados que um "backend" (HTTP ou simulado) fornece ao composition root. */
export type AdaptadoresBackend = Omit<AppDependencies, 'sessionStore' | 'clock'>;
