import type { ClienteRepository } from '@/application/ports';
import {
  normalizarDadosCliente,
  validarDadosCliente,
} from '@/application/use-cases/validarDadosCliente';
import { StatusCliente } from '@/domain/enums';
import { filtrarClientes } from '@/infrastructure/shared/filtros';
import { toISODate } from '@/shared/lib/date';
import { acessoNegado } from './erros';
import { ehAdministrador, exigirAcessoAoCliente } from './autorizacao';
import { garantirCadastroUnico, validarStatusCliente } from './cadastro';
import { buscarCliente, porId, proximoId, semSenha } from './consultas';
import type { ContextoMock } from './contexto';
import type { ClienteMock } from './tipos';

const SEM_ACESSO = 'Você só pode acessar o seu próprio cadastro.';

/** /api/clientes — administração (admin) e "Meus dados" (o próprio cliente). */
export function createMockClienteRepository({
  executar,
  autorizacao,
}: ContextoMock): ClienteRepository {
  return {
    listar: (filtro) =>
      executar((dados) => {
        autorizacao.exigirAdministrador();
        return filtrarClientes(dados.clientes.map(semSenha), filtro).sort(porId);
      }),
    obterPorId: (id) =>
      executar((dados) => {
        exigirAcessoAoCliente(autorizacao.autenticar(), id, SEM_ACESSO);
        return semSenha(buscarCliente(dados, id));
      }),
    criar: (input) =>
      executar((dados, agora) => {
        autorizacao.exigirAdministrador();
        validarDadosCliente(input, { exigirSenha: true, hoje: toISODate(agora) });
        validarStatusCliente(input.status);
        const normalizados = normalizarDadosCliente(input);
        garantirCadastroUnico(dados, { ...normalizados, status: input.status });
        const cliente: ClienteMock = {
          id: proximoId(dados.clientes),
          ...normalizados,
          status: input.status,
          senha: input.senha,
        };
        dados.clientes.push(cliente);
        return semSenha(cliente);
      }),
    atualizar: (id, input) =>
      executar((dados, agora) => {
        const solicitante = autorizacao.autenticar();
        exigirAcessoAoCliente(solicitante, id, SEM_ACESSO);
        const cliente = buscarCliente(dados, id);
        if (!ehAdministrador(solicitante) && input.status !== cliente.status) {
          throw acessoNegado('Somente a administração pode alterar o status do cadastro.');
        }
        validarDadosCliente(input, { exigirSenha: false, hoje: toISODate(agora) });
        validarStatusCliente(input.status);
        const normalizados = normalizarDadosCliente(input);
        garantirCadastroUnico(dados, { ...normalizados, status: input.status }, id);
        Object.assign(cliente, normalizados, { status: input.status });
        if (input.senha) cliente.senha = input.senha;
        return semSenha(cliente);
      }),
    inativar: (id) =>
      executar((dados) => {
        autorizacao.exigirAdministrador();
        buscarCliente(dados, id).status = StatusCliente.Inativo;
      }),
  };
}
