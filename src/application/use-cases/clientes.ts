import type { ClienteService } from '@/application/services';
import { StatusCliente } from '@/domain/enums';
import { toISODate } from '@/shared/lib/date';
import type { AppDependencies } from './dependencies';
import { normalizarDadosCliente, validarDadosCliente } from './validarDadosCliente';

/** RF01–RF04 — administração de clientes (o backend garante RN01/RN02). */
export function createClienteService({ clienteRepository, clock }: AppDependencies): ClienteService {
  const hoje = () => toISODate(clock.now());
  return {
    listar: (filtro) => clienteRepository.listar(filtro),
    obter: (id) => clienteRepository.obterPorId(id),
    criar: async (input) => {
      validarDadosCliente(input, { exigirSenha: true, hoje: hoje() });
      return clienteRepository.criar({ ...input, ...normalizarDadosCliente(input) });
    },
    atualizar: async (id, input) => {
      validarDadosCliente(input, { exigirSenha: false, hoje: hoje() });
      return clienteRepository.atualizar(id, {
        ...normalizarDadosCliente(input),
        status: input.status,
        ...(input.senha ? { senha: input.senha } : {}),
      });
    },
    alterarStatus: async (id, status) => {
      if (status === StatusCliente.Inativo) {
        await clienteRepository.inativar(id);
        return clienteRepository.obterPorId(id);
      }
      const { nome, cpf, telefone, email, dataNascimento } = await clienteRepository.obterPorId(id);
      return clienteRepository.atualizar(id, { nome, cpf, telefone, email, dataNascimento, status });
    },
  };
}
