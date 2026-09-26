import type { AxiosInstance } from 'axios';
import type { QuadraRepository } from '@/application/ports';
import { mapearDisponibilidade, mapearQuadra } from './mappers/entidades';
import { lerLista, temConteudo } from './mappers/leitura';
import { paraDataApi, paraQuadraRequisicao } from './mappers/requisicoes';

/** /api/quadras */
export function createHttpQuadraRepository(http: AxiosInstance): QuadraRepository {
  const obterPorId = async (id: number) =>
    mapearQuadra((await http.get<unknown>(`/quadras/${id}`)).data);

  return {
    listar: async () =>
      lerLista((await http.get<unknown>('/quadras')).data, 'quadras').map(mapearQuadra),
    obterPorId,
    criar: async (input) =>
      mapearQuadra((await http.post<unknown>('/quadras', paraQuadraRequisicao(input))).data),
    atualizar: async (id, input) => {
      const { data } = await http.put<unknown>(`/quadras/${id}`, paraQuadraRequisicao(input));
      return temConteudo(data) ? mapearQuadra(data) : obterPorId(id);
    },
    inativar: async (id) => {
      await http.delete(`/quadras/${id}`);
    },
    consultarDisponibilidade: async (quadraId, data) => {
      const resposta = await http.get<unknown>(`/quadras/${quadraId}/disponibilidade`, {
        params: { data: paraDataApi(data) },
      });
      return mapearDisponibilidade(resposta.data, { quadraId, data });
    },
  };
}
