/** Subconjunto do Web Storage usado pela aplicação (permite injetar um armazenamento em memória). */
export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

/**
 * localStorage do navegador, ou null quando indisponível (SSR, navegação privada restrita,
 * cookies bloqueados — nesses casos o próprio acesso à propriedade pode lançar SecurityError).
 */
export function obterLocalStorage(): Armazenamento | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function lerItem(armazenamento: Armazenamento | null, chave: string): string | null {
  if (!armazenamento) return null;
  try {
    return armazenamento.getItem(chave);
  } catch {
    return null;
  }
}

/** Devolve false se não foi possível gravar (cota excedida, storage bloqueado...). */
export function gravarItem(
  armazenamento: Armazenamento | null,
  chave: string,
  valor: string,
): boolean {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(chave, valor);
    return true;
  } catch {
    return false;
  }
}

export function removerItem(armazenamento: Armazenamento | null, chave: string): void {
  if (!armazenamento) return;
  try {
    armazenamento.removeItem(chave);
  } catch {
    // Sem acesso ao storage: não há o que remover.
  }
}

export function criarArmazenamentoEmMemoria(): Armazenamento {
  const itens = new Map<string, string>();
  return {
    getItem: (chave) => itens.get(chave) ?? null,
    setItem: (chave, valor) => {
      itens.set(chave, valor);
    },
    removeItem: (chave) => {
      itens.delete(chave);
    },
  };
}
