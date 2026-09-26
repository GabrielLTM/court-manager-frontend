import { describe, expect, it } from 'vitest';
import type { Cliente } from '@/domain/entities';
import { StatusCliente } from '@/domain/enums';
import { cpfEmUso, cpfValido, emailEmUso, emailValido, telefoneValido } from '@/domain/rules';

const cliente = (parcial: Partial<Cliente>): Cliente => ({
  id: 1,
  nome: 'Isadora Oliveira',
  cpf: '012.345.678-90',
  email: 'isadora@email.com',
  telefone: '(51) 99812-4477',
  dataNascimento: null,
  status: StatusCliente.Ativo,
  ...parcial,
});

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos, com ou sem máscara', () => {
    expect(cpfValido('012.345.678-90')).toBe(true);
    expect(cpfValido('01234567890')).toBe(true);
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('rejeita dígito verificador errado, sequências repetidas e tamanho incorreto', () => {
    expect(cpfValido('012.345.678-91')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
    expect(cpfValido('123.456.789')).toBe(false);
    expect(cpfValido('')).toBe(false);
  });
});

describe('RN01 — CPF único entre clientes ativos', () => {
  const clientes = [
    cliente({ id: 1 }),
    cliente({ id: 2, cpf: '159.753.486-25', status: StatusCliente.Inativo }),
  ];

  it('detecta CPF em uso independentemente da máscara', () => {
    expect(cpfEmUso(clientes, '01234567890')).toBe(true);
  });

  it('ignora clientes inativos e o próprio cliente em edição', () => {
    expect(cpfEmUso(clientes, '159.753.486-25')).toBe(false);
    expect(cpfEmUso(clientes, '012.345.678-90', 1)).toBe(false);
  });
});

describe('RN02 — e-mail único', () => {
  it('compara sem diferenciar maiúsculas e espaços', () => {
    expect(emailEmUso([cliente({})], '  Isadora@Email.com ')).toBe(true);
    expect(emailEmUso([cliente({})], 'isadora@email.com', 1)).toBe(false);
  });
});

describe('formatos de contato', () => {
  it('valida e-mail e telefone com DDD', () => {
    expect(emailValido('ana@arena.com')).toBe(true);
    expect(emailValido('ana@arena')).toBe(false);
    expect(telefoneValido('(51) 99812-4477')).toBe(true);
    expect(telefoneValido('(51) 3333-4444')).toBe(true);
    expect(telefoneValido('9981-2447')).toBe(false);
  });
});
