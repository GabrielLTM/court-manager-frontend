import type { Cliente } from '@/domain/entities';
import { StatusCliente } from '@/domain/enums';
import { onlyDigits } from '@/shared/lib/masks';

/** Valida CPF pelos dígitos verificadores (aceita com ou sem máscara). */
export function cpfValido(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base: string, pesoInicial: number) => {
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9), 10) === Number(d[9]) && digito(d.slice(0, 10), 11) === Number(d[10]);
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Telefone brasileiro com DDD: 10 (fixo) ou 11 (celular) dígitos. */
export function telefoneValido(telefone: string): boolean {
  const d = onlyDigits(telefone);
  return d.length === 10 || d.length === 11;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** RN01 — não pode existir mais de um cliente ATIVO com o mesmo CPF. */
export function cpfEmUso(clientes: readonly Cliente[], cpf: string, ignorarClienteId?: number): boolean {
  const alvo = onlyDigits(cpf);
  return clientes.some(
    (c) => c.id !== ignorarClienteId && c.status === StatusCliente.Ativo && onlyDigits(c.cpf) === alvo,
  );
}

/** RN02 — o e-mail utilizado no cadastro deve ser único. */
export function emailEmUso(clientes: readonly Cliente[], email: string, ignorarClienteId?: number): boolean {
  const alvo = normalizarEmail(email);
  return clientes.some((c) => c.id !== ignorarClienteId && normalizarEmail(c.email) === alvo);
}

export function clienteAtivo(cliente: Pick<Cliente, 'status'>): boolean {
  return cliente.status === StatusCliente.Ativo;
}
