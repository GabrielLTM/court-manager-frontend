import { Perfil } from '@/domain/enums';
import { homePathFor, ROUTES } from '@/presentation/routes/paths';

/** Página de origem guardada em `location.state.from` quando o acesso exige login. */
export interface OrigemNavegacao {
  pathname: string;
  search: string;
  hash: string;
}

export interface EstadoLogin {
  from: OrigemNavegacao;
}

const ROTAS_DO_CLIENTE: readonly string[] = [
  ROUTES.reservar,
  ROUTES.minhasReservas,
  ROUTES.meusDados,
];
const PREFIXO_ADMIN = '/admin';

const pertenceA = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/** Perfil exigido por uma rota protegida (`null` = rota pública ou desconhecida). */
export function perfilExigido(pathname: string): Perfil | null {
  if (pertenceA(pathname, PREFIXO_ADMIN)) return Perfil.Administrador;
  if (ROTAS_DO_CLIENTE.some((rota) => pertenceA(pathname, rota))) return Perfil.Cliente;
  return null;
}

export function estadoDeLogin(location: OrigemNavegacao): EstadoLogin {
  return { from: { pathname: location.pathname, search: location.search, hash: location.hash } };
}

/** Lê `state.from` com segurança (o history state pode conter qualquer coisa). */
export function lerOrigem(state: unknown): OrigemNavegacao | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null;
  const { from } = state as { from: unknown };
  if (typeof from !== 'object' || from === null) return null;
  const { pathname, search, hash } = from as Record<string, unknown>;
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  return {
    pathname,
    search: typeof search === 'string' ? search : '',
    hash: typeof hash === 'string' ? hash : '',
  };
}

/**
 * Destino depois do login/cadastro: volta para a página de origem somente se ela pertence ao
 * perfil que acabou de entrar; caso contrário, vai para a home do perfil. Como só aceitamos
 * rotas protegidas conhecidas, não há redirecionamento para endereços externos.
 */
export function destinoAposLogin(state: unknown, perfil: Perfil): string {
  const origem = lerOrigem(state);
  if (origem && perfilExigido(origem.pathname) === perfil) {
    return `${origem.pathname}${origem.search}${origem.hash}`;
  }
  return homePathFor(perfil);
}
