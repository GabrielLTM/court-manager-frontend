import axios, { type AxiosInstance } from 'axios';
import type { SessionStore } from '@/application/ports';
import { mapearErroHttp } from './erros';

export interface OpcoesHttpClient {
  /** Ex.: "/api" (proxy do Vite) ou "http://localhost:5160/api". */
  baseURL: string;
  sessionStore: SessionStore;
  timeoutMs?: number;
}

/**
 * Instância do axios para a API ASP.NET Core: envia `Authorization: Bearer <token>` da sessão
 * atual e converte toda falha em AppError (ver mapearErroHttp).
 */
export function createHttpClient({
  baseURL,
  sessionStore,
  timeoutMs = 15_000,
}: OpcoesHttpClient): AxiosInstance {
  const http = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  http.interceptors.request.use((config) => {
    const token = sessionStore.get()?.token;
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  http.interceptors.response.use(
    (resposta) => resposta,
    (erro: unknown) => Promise.reject(mapearErroHttp(erro, sessionStore)),
  );

  return http;
}
