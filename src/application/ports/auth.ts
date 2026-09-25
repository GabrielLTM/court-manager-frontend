import type { LoginInput, RegistrarClienteInput } from '@/application/dto';
import type { Sessao } from '@/domain/entities';

export interface AuthGateway {
  /** POST /api/auth/login */
  login(credenciais: LoginInput): Promise<Sessao>;
  /** POST /api/auth/register */
  registrar(dados: RegistrarClienteInput): Promise<Sessao>;
}

/**
 * Armazena a sessão do usuário (token JWT + dados do usuário).
 * `get()` DEVE retornar a mesma referência enquanto a sessão não mudar
 * (requisito do useSyncExternalStore). Implementações não devem depender de `this`.
 */
export interface SessionStore {
  get(): Sessao | null;
  set(sessao: Sessao | null): void;
  subscribe(listener: () => void): () => void;
}
