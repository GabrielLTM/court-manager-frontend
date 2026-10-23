export type ApiMode = 'mock' | 'http';
export interface AppEnv {
  readonly apiMode: ApiMode;
  readonly apiBaseUrl: string;
}
declare const ARENA_ENV: AppEnv | undefined;
/** Public values embedded by scripts/ng.mjs; never include credentials. */
export const env: AppEnv = Object.freeze(
  typeof ARENA_ENV === 'undefined' ? { apiMode: 'mock', apiBaseUrl: '/api' } : ARENA_ENV,
);
export const isMockMode = env.apiMode === 'mock';
