import { AppError } from '@/application/errors';
import { ehRegistro, type Registro } from '@/infrastructure/shared/registro';
import { normalizeTime } from '@/shared/lib/time';

/**
 * Leitura tolerante do JSON da API: o backend ainda está em construção e pode variar a grafia das
 * propriedades (`clienteId`, `ClienteID`, `cliente_id`), o formato de datas (DateOnly/DateTime) e
 * de horários (TimeOnly "19:00:00").
 */

const normalizarChave = (chave: string) => chave.toLowerCase().replace(/_/g, '');

/** Primeiro campo presente (não nulo) entre os nomes informados, ignorando caixa e "_". */
export function campo(registro: Registro, ...nomes: string[]): unknown {
  const entradas = Object.entries(registro);
  for (const nome of nomes) {
    const alvo = normalizarChave(nome);
    const encontrada = entradas.find(
      ([chave, valor]) => valor !== undefined && valor !== null && normalizarChave(chave) === alvo,
    );
    if (encontrada) return encontrada[1];
  }
  return undefined;
}

export function respostaInesperada(detalhe: string): AppError {
  return new AppError(`Resposta inesperada do servidor (${detalhe}).`, { code: 'DESCONHECIDO' });
}

export function exigirRegistro(valor: unknown, entidade: string): Registro {
  if (!ehRegistro(valor)) throw respostaInesperada(entidade);
  return valor;
}

export function exigir<T>(valor: T | null | undefined, detalhe: string): T {
  if (valor === null || valor === undefined) throw respostaInesperada(detalhe);
  return valor;
}

/** Aceita números e strings numéricas ("80", "80.5", "80,5"). */
export function lerNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const numero = Number(valor.trim().replace(',', '.'));
  return Number.isFinite(numero) ? numero : null;
}

export function lerTexto(valor: unknown): string | null {
  if (typeof valor === 'string') return valor;
  return typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : null;
}

/** Id de um objeto aninhado (ex.: `{ cliente: { id: 3 } }`). */
export function idAninhado(registro: Registro, nome: string): number | null {
  const aninhado = campo(registro, nome);
  return ehRegistro(aninhado) ? lerNumero(campo(aninhado, 'id')) : null;
}

/** DateOnly "2026-09-20", DateTime "2026-09-20T00:00:00" ou "20/09/2026" → "2026-09-20". */
export function lerData(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(texto);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : null;
}

/** TimeOnly "19:00:00", "19:00", DateTime "...T19:00:00" ou `{ hour, minute }` → "19:00". */
export function lerHora(valor: unknown): string | null {
  if (ehRegistro(valor)) {
    const hora = lerNumero(campo(valor, 'hour', 'hora'));
    const minuto = lerNumero(campo(valor, 'minute', 'minuto')) ?? 0;
    return hora === null ? null : normalizeTime(`${hora}:${minuto}`);
  }
  if (typeof valor !== 'string') return null;
  const texto = valor.includes('T') ? valor.slice(valor.indexOf('T') + 1) : valor;
  const partes = /^(\d{1,2}):(\d{2})/.exec(texto.trim());
  return partes ? normalizeTime(`${partes[1]}:${partes[2]}`) : null;
}

/**
 * Date-time ISO 8601. Frações com mais de 3 dígitos (DateTime do .NET) são truncadas para os
 * navegadores mais estritos; o valor padrão do .NET ("0001-01-01...") é tratado como ausente.
 */
export function lerDataHora(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim() || valor.startsWith('0001-01-01')) return null;
  const texto = valor.trim().replace(/(\.\d{3})\d+/, '$1');
  return Number.isNaN(Date.parse(texto)) ? null : texto;
}

/** Aceita um array ou um envelope comum (`$values` do ReferenceHandler.Preserve, `items`, `data`...). */
export function lerLista(valor: unknown, entidade: string): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (ehRegistro(valor)) {
    const interna = campo(valor, '$values', 'items', 'itens', 'data', 'dados', 'value', 'results');
    if (Array.isArray(interna)) return interna;
  }
  throw respostaInesperada(`lista de ${entidade}`);
}

/** Respostas 204/vazias (ex.: PUT que devolve NoContent). */
export function temConteudo(corpo: unknown): boolean {
  return corpo !== undefined && corpo !== null && corpo !== '';
}
