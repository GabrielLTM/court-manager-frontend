import { DomainError } from '@/domain/errors/DomainError';
import { cpfValido, emailValido, normalizarEmail, telefoneValido } from '@/domain/rules';
import { isISODate } from '@/shared/lib/date';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';

export const TAMANHO_MINIMO_SENHA = 6;

export interface DadosCadastraisCliente {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string | null;
  senha?: string;
}

/**
 * Validações de formato do cadastro (RF01/RF02, seção 6.1). Usadas como pré-validação nos casos
 * de uso e revalidadas pelo backend simulado. Lança DomainError('VALIDACAO') na primeira falha.
 */
export function validarDadosCliente(
  dados: DadosCadastraisCliente,
  opcoes: { exigirSenha: boolean; hoje: string },
): void {
  if (dados.nome.trim().length < 3) throw new DomainError('VALIDACAO', 'Informe o nome completo.');
  if (!cpfValido(dados.cpf)) throw new DomainError('VALIDACAO', 'CPF inválido.');
  if (!emailValido(dados.email)) throw new DomainError('VALIDACAO', 'Formato de e-mail inválido.');
  if (!telefoneValido(dados.telefone)) {
    throw new DomainError('VALIDACAO', 'Telefone inválido — informe DDD + número.');
  }
  const nascimento = dados.dataNascimento;
  if (nascimento && (!isISODate(nascimento) || nascimento > opcoes.hoje || nascimento < '1900-01-01')) {
    throw new DomainError('VALIDACAO', 'Data de nascimento inválida.');
  }
  const senha = dados.senha ?? '';
  if ((opcoes.exigirSenha || senha !== '') && senha.length < TAMANHO_MINIMO_SENHA) {
    throw new DomainError('VALIDACAO', `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }
}

/** Padroniza os dados cadastrais: nome sem espaços extras, CPF/telefone com máscara, e-mail minúsculo. */
export function normalizarDadosCliente(
  dados: DadosCadastraisCliente,
): Omit<DadosCadastraisCliente, 'senha'> {
  return {
    nome: dados.nome.trim(),
    cpf: maskCpf(dados.cpf),
    email: normalizarEmail(dados.email),
    telefone: maskTelefone(dados.telefone),
    dataNascimento: dados.dataNascimento || null,
  };
}
