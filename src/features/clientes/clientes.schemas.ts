import { z } from 'zod';
import { cpfValido, emailValido, telefoneValido } from '@/core/domain/rules';
import { isISODate, parseISODate } from '@/shared/lib/date';

/**
 * Validações de interface (seção 6.1): campos obrigatórios, formato de e-mail, dados, senhas.
 * Não substituem as validações do backend.
 */

function dataNascimentoValida(valor: string): boolean {
  if (!isISODate(valor)) return false;
  const data = parseISODate(valor);
  return data < new Date() && data.getFullYear() >= 1900;
}

const nome = z.string().trim().min(3, { error: 'Informe o nome completo.' });
const cpf = z
  .string()
  .trim()
  .min(1, { error: 'Informe o CPF.' })
  .refine(cpfValido, { error: 'CPF inválido.' });
const telefone = z
  .string()
  .trim()
  .min(1, { error: 'Informe o telefone.' })
  .refine(telefoneValido, { error: 'Telefone inválido — informe DDD + número.' });
export const email = z
  .string()
  .trim()
  .min(1, { error: 'Informe o e-mail.' })
  .refine(emailValido, { error: 'Formato de e-mail inválido.' });
const dataNascimento = z
  .string()
  .min(1, { error: 'Informe a data de nascimento.' })
  .refine(dataNascimentoValida, { error: 'Data de nascimento inválida.' });
export const senha = z.string().min(6, { error: 'A senha deve ter pelo menos 6 caracteres.' });
const senhaOpcional = z
  .string()
  .refine((v) => v === '' || v.length >= 6, { error: 'A senha deve ter pelo menos 6 caracteres.' });
const statusCliente = z.enum(['1', '2']);

/** Campos comuns do cliente (RF01/RF02). */
export const clienteCamposSchema = z.object({ nome, cpf, dataNascimento, telefone, email });

/** "Meus dados" do cliente logado — senha opcional. */
export const perfilSchema = clienteCamposSchema.extend({ senha: senhaOpcional });
export type PerfilFormValues = z.infer<typeof perfilSchema>;

/** Administração de clientes: criação exige senha; edição mantém a atual se vazia. */
export const clienteNovoSchema = clienteCamposSchema.extend({ senha, status: statusCliente });
export const clienteEdicaoSchema = clienteCamposSchema.extend({ senha: senhaOpcional, status: statusCliente });
export type ClienteFormValues = z.infer<typeof clienteEdicaoSchema>;
