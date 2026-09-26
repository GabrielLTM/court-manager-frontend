export const APP_NAME = 'Arena Beach Tennis';

/** Metadados declarados no `handle` de cada rota. */
export interface RouteHandle {
  /** Título da página: document.title = "<title> · Arena Beach Tennis". */
  title?: string;
}

function tituloDoHandle(handle: unknown): string | undefined {
  if (typeof handle !== 'object' || handle === null || !('title' in handle)) return undefined;
  const { title } = handle as RouteHandle;
  return typeof title === 'string' && title.trim() !== '' ? title : undefined;
}

/** Título declarado pela rota mais específica (a última correspondência que tiver um). */
export function tituloDasRotas(matches: ReadonlyArray<{ handle: unknown }>): string | undefined {
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const titulo = tituloDoHandle(matches[i].handle);
    if (titulo) return titulo;
  }
  return undefined;
}

export function tituloDoDocumento(titulo?: string): string {
  return titulo ? `${titulo} · ${APP_NAME}` : APP_NAME;
}
