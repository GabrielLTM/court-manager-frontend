/** Código da regra de negócio violada (seção 8 da especificação) ou validação genérica. */
export type CodigoRegra =
  | 'RN01'
  | 'RN02'
  | 'RN03'
  | 'RN04'
  | 'RN05'
  | 'RN06'
  | 'RN07'
  | 'RN08'
  | 'RN09'
  | 'RN10'
  | 'VALIDACAO';

export class DomainError extends Error {
  readonly regra: CodigoRegra;

  constructor(regra: CodigoRegra, message: string) {
    super(message);
    this.name = 'DomainError';
    this.regra = regra;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
