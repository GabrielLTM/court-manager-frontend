import { createContext, useContext } from 'react';
import type { LoginInput, RegistrarClienteInput } from '@/application/dto';
import type { Sessao, UsuarioAutenticado } from '@/domain/entities';

export interface AuthContextValue {
  sessao: Sessao | null;
  usuario: UsuarioAutenticado | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login(input: LoginInput): Promise<Sessao>;
  registrar(input: RegistrarClienteInput): Promise<Sessao>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
