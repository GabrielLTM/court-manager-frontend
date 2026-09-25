export const onlyDigits = (valor: string): string => valor.replace(/\D/g, '');

/** Máscara progressiva de CPF: 000.000.000-00 */
export function maskCpf(valor: string): string {
  const d = onlyDigits(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/** Máscara progressiva de telefone: (51) 99812-4477 ou (51) 3333-4444 */
export function maskTelefone(valor: string): string {
  const d = onlyDigits(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length === 9 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
