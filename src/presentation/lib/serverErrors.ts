import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isAppError } from '@/application/errors';
import { isDomainError, type CodigoRegra } from '@/domain/errors/DomainError';

/** Regras de negócio que apontam para um campo específico do formulário. */
const CAMPO_POR_REGRA: Partial<Record<CodigoRegra, string>> = { RN01: 'cpf', RN02: 'email' };

/** "Email", "$.email", "DataNascimento" → "email", "email", "datanascimento". */
const normalizar = (campo: string) => campo.replace(/[^a-z]/gi, '').toLowerCase();

/**
 * Exibe junto ao campo os erros devolvidos pela API/backend simulado: `fieldErrors`
 * (ValidationProblemDetails / 409 com o campo) e as regras RN01 (CPF) e RN02 (e-mail).
 * Retorna `true` se algum campo recebeu erro. O toast com a mensagem continua a cargo de quem chama.
 */
export function aplicarErrosDoServidor<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos: ReadonlyArray<Path<T>>,
): boolean {
  const aplicados = new Set<Path<T>>();
  const aplicar = (campo: string, mensagem: string | undefined) => {
    const alvo = campos.find((c) => normalizar(c) === normalizar(campo));
    if (!alvo || !mensagem || aplicados.has(alvo)) return;
    setError(alvo, { type: 'server', message: mensagem }, { shouldFocus: aplicados.size === 0 });
    aplicados.add(alvo);
  };

  if (isAppError(error) && error.fieldErrors) {
    for (const [campo, mensagens] of Object.entries(error.fieldErrors)) {
      aplicar(campo, mensagens[0]);
    }
  }
  if (isDomainError(error)) {
    const campo = CAMPO_POR_REGRA[error.regra];
    if (campo) aplicar(campo, error.message);
  }
  return aplicados.size > 0;
}
