import { z } from 'zod';
import { clienteCamposSchema, email, senha } from '@/features/clientes/clientes.schemas';

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, { error: 'Informe a senha.' }),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** Autocadastro (/cadastro). */
export const cadastroSchema = clienteCamposSchema.extend({ senha });
export type CadastroFormValues = z.infer<typeof cadastroSchema>;
