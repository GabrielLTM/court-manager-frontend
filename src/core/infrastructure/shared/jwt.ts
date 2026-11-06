import { ehRegistro, type Registro } from './registro';

/** Base64url (RFC 4648 §5) de um texto UTF-8. */
export function codificarBase64Url(texto: string): string {
  let binario = '';
  for (const byte of new TextEncoder().encode(texto)) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodificarBase64Url(valor: string): string {
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

/** Lê o payload (claims) de um JWT sem validar a assinatura. Devolve null se o token for malformado. */
export function lerClaimsJwt(token: string): Registro | null {
  const partes = token.split('.');
  if (partes.length !== 3 || !partes[1]) return null;
  try {
    const claims: unknown = JSON.parse(decodificarBase64Url(partes[1]));
    return ehRegistro(claims) ? claims : null;
  } catch {
    return null;
  }
}
