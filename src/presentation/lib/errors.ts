import { isAppError } from '@/application/errors';

/** Mensagem amigável para exibir ao usuário a partir de qualquer erro. */
export function getErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (isAppError(error) && error.fieldErrors) {
    const primeiro = Object.values(error.fieldErrors).flat()[0];
    if (primeiro) return primeiro;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
