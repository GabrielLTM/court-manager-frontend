const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Ex.: 80 -> "R$ 80,00" (troca o espaço não separável do Intl por espaço comum, como no protótipo). */
export function formatBRL(valor: number): string {
  return brl.format(valor).replace(/\s/g, ' ');
}

/** 60 -> "1h", 90 -> "1h30", 120 -> "2h", 30 -> "30min" */
export function formatDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** 60 -> "1 hora", 90 -> "1h30", 120 -> "2 horas" (rótulos dos botões de duração). */
export function formatDuracaoLonga(minutos: number): string {
  if (minutos % 60 !== 0) return formatDuracao(minutos);
  const h = minutos / 60;
  return h === 1 ? '1 hora' : `${h} horas`;
}

/** Código amigável exibido para uma reserva: 1041 -> "RSV-1041". */
export function formatCodigoReserva(id: number): string {
  return `RSV-${id}`;
}

/** "Isadora Oliveira" -> "IO" */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function formatPercentual(valor: number): string {
  return `${Math.round(valor)}%`;
}

/** Converte "80", "80,5" ou "80.50" em número. Retorna NaN se inválido. */
export function parseDecimal(valor: string): number {
  const normalizado = valor.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  return normalizado === '' ? Number.NaN : Number(normalizado);
}
