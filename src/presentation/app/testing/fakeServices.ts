import { vi } from 'vitest';
import type { AtualizarPerfilInput, LoginInput, RegistrarClienteInput } from '@/application/dto';
import { AppError } from '@/application/errors';
import type { AppServices } from '@/application/services';
import { CONTAS_DEMO } from '@/config/demo';
import type { Cliente, Sessao } from '@/domain/entities';
import { Perfil, StatusCliente } from '@/domain/enums';

/**
 * AppServices falso para testes da camada de apresentação: autenticação em memória (reativa,
 * como o SessionStore real) e perfil do cliente. Os demais serviços rejeitam — as páginas que
 * dependem deles devem ser substituídas por vi.mock nos testes de roteamento.
 */

export const CLIENTE_DEMO: Cliente = {
  id: 1,
  nome: 'Isadora Oliveira',
  cpf: '012.345.678-90',
  email: CONTAS_DEMO[Perfil.Cliente].email,
  telefone: '(51) 99812-4477',
  dataNascimento: '1998-03-14',
  status: StatusCliente.Ativo,
};

export const SESSAO_CLIENTE: Sessao = {
  token: 'token-cliente',
  expiraEm: null,
  usuario: {
    id: 2,
    nome: CLIENTE_DEMO.nome,
    email: CLIENTE_DEMO.email,
    perfil: Perfil.Cliente,
    clienteId: CLIENTE_DEMO.id,
  },
};

export const SESSAO_ADMIN: Sessao = {
  token: 'token-admin',
  expiraEm: null,
  usuario: {
    id: 1,
    nome: 'Gabriel Lessa',
    email: CONTAS_DEMO[Perfil.Administrador].email,
    perfil: Perfil.Administrador,
    clienteId: null,
  },
};

const CONTAS = [
  { ...CONTAS_DEMO[Perfil.Cliente], sessao: SESSAO_CLIENTE },
  { ...CONTAS_DEMO[Perfil.Administrador], sessao: SESSAO_ADMIN },
];

export const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

const indisponivel = () => Promise.reject(new Error('Serviço indisponível no teste.'));

export function createFakeServices({ sessao = null }: { sessao?: Sessao | null } = {}) {
  let atual: Sessao | null = sessao;
  let cliente: Cliente = { ...CLIENTE_DEMO };
  const listeners = new Set<() => void>();

  const definirSessao = (nova: Sessao | null) => {
    atual = nova;
    listeners.forEach((listener) => listener());
  };

  const services = {
    auth: {
      login: vi.fn(async ({ email, senha }: LoginInput) => {
        const conta = CONTAS.find(
          (c) => c.email === email.trim().toLowerCase() && c.senha === senha,
        );
        if (!conta)
          throw new AppError(MENSAGEM_CREDENCIAIS_INVALIDAS, {
            code: 'NAO_AUTENTICADO',
            status: 401,
          });
        definirSessao(conta.sessao);
        return conta.sessao;
      }),
      registrar: vi.fn(async (input: RegistrarClienteInput) => {
        const nova: Sessao = {
          token: 'token-novo',
          expiraEm: null,
          usuario: {
            id: 99,
            nome: input.nome,
            email: input.email,
            perfil: Perfil.Cliente,
            clienteId: 99,
          },
        };
        definirSessao(nova);
        return nova;
      }),
      logout: vi.fn(() => definirSessao(null)),
      sessaoAtual: () => atual,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    perfil: {
      obter: vi.fn(async () => ({ ...cliente })),
      atualizar: vi.fn(
        async ({ nome, cpf, telefone, email, dataNascimento }: AtualizarPerfilInput) => {
          cliente = { ...cliente, nome, cpf, telefone, email, dataNascimento };
          return { ...cliente };
        },
      ),
    },
    quadras: {
      listar: vi.fn(indisponivel),
      obter: vi.fn(indisponivel),
      criar: vi.fn(indisponivel),
      atualizar: vi.fn(indisponivel),
      alterarStatus: vi.fn(indisponivel),
      consultarDisponibilidade: vi.fn(indisponivel),
    },
    clientes: {
      listar: vi.fn(indisponivel),
      obter: vi.fn(indisponivel),
      criar: vi.fn(indisponivel),
      atualizar: vi.fn(indisponivel),
      alterarStatus: vi.fn(indisponivel),
    },
    reservas: {
      listar: vi.fn(indisponivel),
      obter: vi.fn(indisponivel),
      criar: vi.fn(indisponivel),
      alterar: vi.fn(indisponivel),
      cancelar: vi.fn(indisponivel),
    },
    pagamentos: {
      listar: vi.fn(indisponivel),
      registrar: vi.fn(indisponivel),
      confirmar: vi.fn(indisponivel),
    },
    dashboard: { obterResumo: vi.fn(indisponivel) },
    clock: { now: () => new Date(2026, 8, 20, 10, 0) },
  } satisfies AppServices;

  return { services, definirSessao };
}
