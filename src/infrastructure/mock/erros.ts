import { AppError } from '@/application/errors';
import { MENSAGENS } from '@/application/mensagens';

/** Respostas de erro equivalentes às da API real (status HTTP + código da aplicação). */

export const naoAutenticado = (mensagem: string = MENSAGENS.sessaoExpirada) =>
  new AppError(mensagem, { code: 'NAO_AUTENTICADO', status: 401 });

export const acessoNegado = (mensagem: string = MENSAGENS.acessoNegado) =>
  new AppError(mensagem, { code: 'ACESSO_NEGADO', status: 403 });

export const naoEncontrado = (mensagem: string) => new AppError(mensagem, { code: 'NAO_ENCONTRADO', status: 404 });

export const conflito = (mensagem: string, fieldErrors?: Record<string, string[]>) =>
  new AppError(mensagem, { code: 'CONFLITO', status: 409, fieldErrors });
