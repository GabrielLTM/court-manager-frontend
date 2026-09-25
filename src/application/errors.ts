/** Erro de aplicação/infraestrutura (HTTP, autenticação, recurso não encontrado...). */
export type CodigoErroAplicacao =
  | 'NAO_AUTENTICADO'
  | 'ACESSO_NEGADO'
  | 'NAO_ENCONTRADO'
  | 'CONFLITO'
  | 'VALIDACAO'
  | 'REDE'
  | 'DESCONHECIDO';

export class AppError extends Error {
  readonly code: CodigoErroAplicacao;
  readonly status?: number;
  /** Erros de validação por campo (ex.: ValidationProblemDetails do ASP.NET Core). */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      code?: CodigoErroAplicacao;
      status?: number;
      fieldErrors?: Record<string, string[]>;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code ?? 'DESCONHECIDO';
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
