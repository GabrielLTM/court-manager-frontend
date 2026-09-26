import type { Sessao, UsuarioAutenticado } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { lerClaimsJwt } from '@/infrastructure/shared/jwt';
import { ehRegistro, type Registro } from '@/infrastructure/shared/registro';
import { lerPerfil } from './enums';
import {
  campo,
  exigir,
  exigirRegistro,
  lerDataHora,
  lerNumero,
  lerTexto,
  respostaInesperada,
} from './leitura';

/** Claims padrão emitidos pelo ASP.NET Core (ClaimTypes.*) quando não há mapeamento para nomes curtos. */
const CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_NOME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_PERFIL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/**
 * Resposta de /auth/login e /auth/register: `{ token, expiraEm?, usuario }`. Se `usuario` não
 * vier, os dados são lidos dos claims do JWT (sub/nameid, name/unique_name, email, role, clienteId).
 */
export function mapearSessao(json: unknown, agora: Date = new Date()): Sessao {
  const r = exigirRegistro(json, 'autenticação');
  const token = exigir(lerTexto(campo(r, 'token', 'accessToken', 'jwt')), 'autenticação.token');
  const claims = lerClaimsJwt(token);
  const usuarioJson = campo(r, 'usuario', 'user');
  const usuario = ehRegistro(usuarioJson)
    ? mapearUsuario(usuarioJson)
    : claims
      ? usuarioDosClaims(claims)
      : null;
  if (!usuario) throw respostaInesperada('autenticação.usuario');
  return { token, usuario, expiraEm: lerExpiracao(r, claims, agora) };
}

function mapearUsuario(r: Registro): UsuarioAutenticado {
  return montarUsuario({
    id: lerNumero(campo(r, 'id', 'usuarioId')),
    nome: lerTexto(campo(r, 'nome', 'name')),
    email: lerTexto(campo(r, 'email')),
    perfil: lerPerfil(campo(r, 'perfil', 'role', 'roles', 'papel')),
    clienteId: lerNumero(campo(r, 'clienteId')),
  });
}

function usuarioDosClaims(claims: Registro): UsuarioAutenticado {
  return montarUsuario({
    id: lerNumero(campo(claims, 'sub', 'nameid', CLAIM_ID, 'id')),
    nome: lerTexto(campo(claims, 'name', 'unique_name', CLAIM_NOME, 'nome', 'given_name')),
    email: lerTexto(campo(claims, 'email', CLAIM_EMAIL)),
    perfil: lerPerfil(campo(claims, 'role', 'roles', CLAIM_PERFIL, 'perfil')),
    clienteId: lerNumero(campo(claims, 'clienteId')),
  });
}

function montarUsuario(dados: {
  id: number | null;
  nome: string | null;
  email: string | null;
  perfil: Perfil | null;
  clienteId: number | null;
}): UsuarioAutenticado {
  const id = exigir(dados.id, 'usuario.id');
  const perfil = exigir(dados.perfil, 'usuario.perfil');
  const email = dados.email ?? '';
  return {
    id,
    nome: dados.nome ?? email,
    email,
    perfil,
    // Sem `clienteId` explícito, assume-se que o usuário Cliente é identificado pelo próprio id.
    clienteId: perfil === Perfil.Cliente ? (dados.clienteId ?? id) : null,
  };
}

function lerExpiracao(r: Registro, claims: Registro | null, agora: Date): string | null {
  const explicita = lerDataHora(
    campo(r, 'expiraEm', 'expiresAt', 'expiration', 'expira', 'validoAte'),
  );
  if (explicita) return new Date(explicita).toISOString();
  const segundos = lerNumero(campo(r, 'expiresIn'));
  if (segundos !== null) return new Date(agora.getTime() + segundos * 1000).toISOString();
  const exp = claims ? lerNumero(campo(claims, 'exp')) : null;
  return exp === null ? null : new Date(exp * 1000).toISOString();
}
