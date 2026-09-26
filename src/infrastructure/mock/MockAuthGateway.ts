import { MENSAGENS } from '@/application/mensagens';
import type { AuthGateway } from '@/application/ports';
import {
  normalizarDadosCliente,
  validarDadosCliente,
} from '@/application/use-cases/validarDadosCliente';
import type { Sessao, UsuarioAutenticado } from '@/domain/entities';
import { Perfil, StatusCliente } from '@/domain/enums';
import { normalizarEmail } from '@/domain/rules';
import { toISODate } from '@/shared/lib/date';
import { garantirCadastroUnico } from './cadastro';
import { proximoId } from './consultas';
import type { ContextoMock } from './contexto';
import { acessoNegado, naoAutenticado } from './erros';
import type { ClienteMock } from './tipos';
import { criarTokenSimulado } from './token';

/** /api/auth — login (clientes e administração) e autocadastro do cliente (RF01). */
export function createMockAuthGateway({ executar }: ContextoMock): AuthGateway {
  return {
    login: ({ email, senha }) =>
      executar((dados, agora) => {
        const alvo = normalizarEmail(email);
        const administrador = dados.administradores.find((a) => normalizarEmail(a.email) === alvo);
        if (administrador) {
          if (administrador.senha !== senha) throw naoAutenticado(MENSAGENS.credenciaisInvalidas);
          const { id, nome } = administrador;
          return criarSessao(
            { id, nome, email: administrador.email, perfil: Perfil.Administrador, clienteId: null },
            agora,
          );
        }
        const cliente = dados.clientes.find((c) => normalizarEmail(c.email) === alvo);
        if (!cliente || cliente.senha !== senha)
          throw naoAutenticado(MENSAGENS.credenciaisInvalidas);
        if (cliente.status !== StatusCliente.Ativo) throw acessoNegado(MENSAGENS.cadastroInativo);
        return criarSessao(usuarioDoCliente(cliente), agora);
      }),
    registrar: (input) =>
      executar((dados, agora) => {
        validarDadosCliente(input, { exigirSenha: true, hoje: toISODate(agora) });
        const normalizados = normalizarDadosCliente(input);
        garantirCadastroUnico(dados, { ...normalizados, status: StatusCliente.Ativo });
        const cliente: ClienteMock = {
          id: proximoId(dados.clientes),
          ...normalizados,
          status: StatusCliente.Ativo,
          senha: input.senha,
        };
        dados.clientes.push(cliente);
        return criarSessao(usuarioDoCliente(cliente), agora);
      }),
  };
}

function usuarioDoCliente(cliente: ClienteMock): UsuarioAutenticado {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    perfil: Perfil.Cliente,
    clienteId: cliente.id,
  };
}

function criarSessao(usuario: UsuarioAutenticado, agora: Date): Sessao {
  const { token, expiraEm } = criarTokenSimulado(usuario, agora);
  return { token, expiraEm, usuario };
}
