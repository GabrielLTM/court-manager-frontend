import type { UsuarioAutenticado } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { codificarBase64Url, lerClaimsJwt } from '@/infrastructure/shared/jwt';
import type { Solicitante } from './tipos';

/**
 * JWT simulado: base64url(cabeçalho).base64url(claims).assinatura. A "assinatura" é um hash
 * FNV-1a com um segredo local — suficiente para detectar edição manual do token no navegador.
 */

const SEGREDO = 'arena-beach-tennis.mock';
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

function assinar(conteudo: string): string {
  const texto = `${conteudo}.${SEGREDO}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash = Math.imul(hash ^ texto.charCodeAt(i), 0x01000193) >>> 0;
  }
  return codificarBase64Url(hash.toString(16).padStart(8, '0'));
}

export function criarTokenSimulado(usuario: UsuarioAutenticado, agora: Date): { token: string; expiraEm: string } {
  const expiraEm = new Date(agora.getTime() + DURACAO_SESSAO_MS);
  const cabecalho = codificarBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = codificarBase64Url(
    JSON.stringify({
      sub: String(usuario.id),
      name: usuario.nome,
      email: usuario.email,
      role: usuario.perfil,
      ...(usuario.clienteId === null ? {} : { clienteId: usuario.clienteId }),
      iat: Math.floor(agora.getTime() / 1000),
      exp: Math.floor(expiraEm.getTime() / 1000),
    }),
  );
  return { token: `${cabecalho}.${claims}.${assinar(`${cabecalho}.${claims}`)}`, expiraEm: expiraEm.toISOString() };
}

/** Valida assinatura e expiração; devolve null para tokens inválidos, adulterados ou expirados. */
export function verificarTokenSimulado(token: string, agora: Date): Solicitante | null {
  const [cabecalho, claims, assinatura] = token.split('.');
  if (!cabecalho || !claims || assinatura !== assinar(`${cabecalho}.${claims}`)) return null;
  const payload = lerClaimsJwt(token);
  if (!payload) return null;
  const { sub, role, clienteId, exp } = payload;
  if (typeof exp !== 'number' || exp * 1000 <= agora.getTime()) return null;
  const usuarioId = Number(sub);
  if (!Number.isInteger(usuarioId)) return null;
  if (role === Perfil.Administrador) return { usuarioId, perfil: role, clienteId: null };
  if (role === Perfil.Cliente && typeof clienteId === 'number') return { usuarioId, perfil: role, clienteId };
  return null;
}
