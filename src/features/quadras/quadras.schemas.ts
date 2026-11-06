import { z } from 'zod';
import { parseDecimal } from '@/shared/lib/format';

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
