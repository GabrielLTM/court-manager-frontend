import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import type { Sessao } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { criarArmazenamentoEmMemoria } from '@/infrastructure/storage/armazenamento';
import { createLocalStorageSessionStore } from '@/infrastructure/storage/LocalStorageSessionStore';
import { createHttpClient } from '../httpClient';

const sessao: Sessao = {
  token: 'token-jwt',
  expiraEm: null,
  usuario: {
    id: 1,
    nome: 'Isadora Oliveira',
    email: 'isadora@email.com',
    perfil: Perfil.Cliente,
    clienteId: 1,
  },
};

/** Cliente HTTP cujo "servidor" é uma função (adapter do axios). */
function criarCliente(
  responder: (config: InternalAxiosRequestConfig) => { status: number; data?: unknown } | 'rede',
) {
  const sessionStore = createLocalStorageSessionStore({ storage: criarArmazenamentoEmMemoria() });
  sessionStore.set(sessao);
  const http = createHttpClient({ baseURL: '/api', sessionStore });
  http.defaults.adapter = async (config) => {
    const resposta = responder(config);
    if (resposta === 'rede') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    const axiosResponse: AxiosResponse = {
      data: resposta.data,
      status: resposta.status,
      statusText: '',
      headers: {},
      config,
    };
    if (resposta.status >= 400) {
      throw new AxiosError('Falha', AxiosError.ERR_BAD_REQUEST, config, null, axiosResponse);
    }
    return axiosResponse;
  };
  return { http, sessionStore };
}

describe('createHttpClient', () => {
  it('envia o token JWT no cabeçalho Authorization', async () => {
    let autorizacao: unknown;
    const { http } = criarCliente((config) => {
      autorizacao = config.headers.get('Authorization');
      return { status: 200, data: [] };
    });
    await http.get('/quadras');
    expect(autorizacao).toBe('Bearer token-jwt');
  });

  it('400 com ValidationProblemDetails → VALIDACAO com erros por campo', async () => {
    const { http } = criarCliente(() => ({
      status: 400,
      data: {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { Nome: ['Informe o nome.'], '$.valorHora': ['Valor inválido.'] },
      },
    }));
    await expect(http.post('/quadras', {})).rejects.toMatchObject({
      code: 'VALIDACAO',
      status: 400,
      message: 'Informe o nome.',
      fieldErrors: { nome: ['Informe o nome.'], valorHora: ['Valor inválido.'] },
    });
  });

  it('usa `detail` do ProblemDetails, `{ message }` ou texto simples como mensagem', async () => {
    const respostas = [
      {
        status: 409,
        data: {
          title: 'Conflict',
          detail: 'RN04 — já existe uma reserva para esta quadra neste horário.',
        },
      },
      { status: 404, data: { message: 'Quadra não encontrada.' } },
      { status: 400, data: 'Duração inválida.' },
    ];
    const { http } = criarCliente(() => respostas.shift() ?? { status: 500 });
    await expect(http.post('/reservas')).rejects.toMatchObject({
      code: 'CONFLITO',
      message: expect.stringMatching(/^RN04/),
    });
    await expect(http.get('/quadras/9')).rejects.toMatchObject({
      code: 'NAO_ENCONTRADO',
      message: 'Quadra não encontrada.',
    });
    await expect(http.post('/reservas')).rejects.toMatchObject({
      code: 'VALIDACAO',
      message: 'Duração inválida.',
    });
    await expect(http.get('/quadras')).rejects.toMatchObject({ code: 'DESCONHECIDO', status: 500 });
  });

  it('401 no login → "E-mail ou senha inválidos." (sem mexer na sessão)', async () => {
    const { http, sessionStore } = criarCliente(() => ({ status: 401 }));
    await expect(http.post('/auth/login', {})).rejects.toMatchObject({
      code: 'NAO_AUTENTICADO',
      message: 'E-mail ou senha inválidos.',
    });
    expect(sessionStore.get()).toBe(sessao);
  });

  it('401 fora do login encerra a sessão; 403 → ACESSO_NEGADO', async () => {
    const respostas = [{ status: 403 }, { status: 401 }];
    const { http, sessionStore } = criarCliente(() => respostas.shift() ?? { status: 200 });
    await expect(http.get('/clientes')).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
      status: 403,
    });
    await expect(http.get('/reservas')).rejects.toMatchObject({
      code: 'NAO_AUTENTICADO',
      status: 401,
    });
    expect(sessionStore.get()).toBeNull();
  });

  it('falha de rede → REDE com orientação para subir a API', async () => {
    const { http } = criarCliente(() => 'rede');
    await expect(http.get('/quadras')).rejects.toMatchObject({
      code: 'REDE',
      message: 'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
    });
  });
});
