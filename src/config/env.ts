export type ApiMode = 'mock' | 'http';

export interface AppEnv {
  /** "mock": backend simulado no navegador; "http": API REST ASP.NET Core. */
  readonly apiMode: ApiMode;
  /** Base URL do cliente HTTP (padrão "/api", repassado pelo proxy do Vite). */
  readonly apiBaseUrl: string;
}

export const env: AppEnv = Object.freeze({
  apiMode: import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
});

export const isMockMode = env.apiMode === 'mock';
