import { z } from 'zod';
import { cpfValido, emailValido, telefoneValido } from '@/domain/rules';
import { isISODate, parseISODate } from '@/shared/lib/date';
import { parseDecimal } from '@/shared/lib/format';

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
const email = z
  .string()
  .trim()
  .min(1, { error: 'Informe o e-mail.' })
  .refine(emailValido, { error: 'Formato de e-mail inválido.' });
const dataNascimento = z
  .string()
  .min(1, { error: 'Informe a data de nascimento.' })
  .refine(dataNascimentoValida, { error: 'Data de nascimento inválida.' });
const senha = z.string().min(6, { error: 'A senha deve ter pelo menos 6 caracteres.' });
const senhaOpcional = z
  .string()
  .refine((v) => v === '' || v.length >= 6, { error: 'A senha deve ter pelo menos 6 caracteres.' });
const statusCliente = z.enum(['1', '2']);

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, { error: 'Informe a senha.' }),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** Campos comuns do cliente (RF01/RF02). */
export const clienteCamposSchema = z.object({ nome, cpf, dataNascimento, telefone, email });

/** Autocadastro (/cadastro). */
export const cadastroSchema = clienteCamposSchema.extend({ senha });
export type CadastroFormValues = z.infer<typeof cadastroSchema>;

/** "Meus dados" do cliente logado — senha opcional. */
export const perfilSchema = clienteCamposSchema.extend({ senha: senhaOpcional });
export type PerfilFormValues = z.infer<typeof perfilSchema>;

/** Administração de clientes: criação exige senha; edição mantém a atual se vazia. */
export const clienteNovoSchema = clienteCamposSchema.extend({ senha, status: statusCliente });
export const clienteEdicaoSchema = clienteCamposSchema.extend({ senha: senhaOpcional, status: statusCliente });
export type ClienteFormValues = z.infer<typeof clienteEdicaoSchema>;

/** Quadras (RF05/RF06). Valores de formulário são strings; converta no submit. */
export const quadraSchema = z.object({
  nome: z.string().trim().min(2, { error: 'Informe a identificação da quadra.' }),
  tipo: z.string().trim().min(2, { error: 'Informe o tipo da quadra.' }),
  valorHora: z
    .string()
    .trim()
    .min(1, { error: 'Informe o valor por hora.' })
    .refine((v) => parseDecimal(v) > 0, { error: 'Informe um valor por hora maior que zero.' }),
  status: z.enum(['1', '2', '3']),
});
export type QuadraFormValues = z.infer<typeof quadraSchema>;
