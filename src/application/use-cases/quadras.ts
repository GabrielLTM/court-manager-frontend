import type { QuadraInput } from '@/application/dto';
import type { QuadraService } from '@/application/services';
import { StatusQuadra } from '@/domain/enums';
import { validarDadosQuadra } from '@/domain/rules';
import type { AppDependencies } from './dependencies';

/** RF05–RF08 — cadastro, edição, status e disponibilidade das quadras. */
export function createQuadraService({ quadraRepository }: AppDependencies): QuadraService {
  return {
    listar: () => quadraRepository.listar(),
    obter: (id) => quadraRepository.obterPorId(id),
    criar: async (input) => {
      validarDadosQuadra(input);
      return quadraRepository.criar(normalizar(input));
    },
    atualizar: async (id, input) => {
      validarDadosQuadra(input);
      return quadraRepository.atualizar(id, normalizar(input));
    },
    alterarStatus: async (id, status) => {
      if (status === StatusQuadra.Inativa) {
        await quadraRepository.inativar(id);
        return quadraRepository.obterPorId(id);
      }
      const { nome, tipo, valorHora } = await quadraRepository.obterPorId(id);
      return quadraRepository.atualizar(id, { nome, tipo, valorHora, status });
    },
    consultarDisponibilidade: (quadraId, data) =>
      quadraRepository.consultarDisponibilidade(quadraId, data),
  };
}

function normalizar(input: QuadraInput): QuadraInput {
  return { ...input, nome: input.nome.trim(), tipo: input.tipo.trim() };
}
