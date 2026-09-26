/** Latência simulada da "rede": valor fixo em ms ou intervalo aleatório. */
export type Latencia = number | { min: number; max: number };

const LATENCIA_PADRAO: Latencia = { min: 150, max: 400 };

export function criarAtraso(latencia: Latencia = LATENCIA_PADRAO): () => Promise<void> {
  const { min, max } = typeof latencia === 'number' ? { min: latencia, max: latencia } : latencia;
  return () => {
    const ms = min + Math.random() * Math.max(0, max - min);
    return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
  };
}
