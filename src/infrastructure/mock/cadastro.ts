import { normalizarEmail, cpfEmUso, emailEmUso } from '@/domain/rules';
import { StatusCliente, STATUS_CLIENTE_VALUES } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { conflito } from './erros';
import type { DadosMock } from './tipos';

const MENSAGEM_RN01 = 'RN01 — já existe um cliente ativo com este CPF.';
const MENSAGEM_RN02 = 'RN02 — este e-mail já está cadastrado.';

/**
 * RN01 (CPF único entre clientes ativos — vale também para a reativação) e RN02 (e-mail único,
 * inclusive em relação às contas administrativas). Responde 409 com o erro associado ao campo.
 */
export function garantirCadastroUnico(
  dados: DadosMock,
  alvo: { cpf: string; email: string; status: StatusCliente },
  ignorarClienteId?: number,
): void {
  if (alvo.status === StatusCliente.Ativo && cpfEmUso(dados.clientes, alvo.cpf, ignorarClienteId)) {
    throw conflito(MENSAGEM_RN01, { cpf: [MENSAGEM_RN01] });
  }
  const email = normalizarEmail(alvo.email);
  const emailAdministrativo = dados.administradores.some((a) => normalizarEmail(a.email) === email);
  if (emailAdministrativo || emailEmUso(dados.clientes, alvo.email, ignorarClienteId)) {
    throw conflito(MENSAGEM_RN02, { email: [MENSAGEM_RN02] });
  }
}

export function validarStatusCliente(status: StatusCliente): void {
  if (!STATUS_CLIENTE_VALUES.includes(status))
    throw new DomainError('VALIDACAO', 'Status do cliente inválido.');
}
