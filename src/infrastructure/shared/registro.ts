export type Registro = Record<string, unknown>;

/** Objeto JSON simples (não nulo e não array). */
export function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Cópia profunda de dados serializáveis em JSON (as entidades só têm strings, números e null). */
export function clonar<T>(valor: T): T {
  return valor === undefined ? valor : (JSON.parse(JSON.stringify(valor)) as T);
}
