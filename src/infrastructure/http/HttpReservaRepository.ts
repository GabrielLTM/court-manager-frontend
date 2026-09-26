import type { AxiosInstance } from 'axios';
import type { ReservaRepository } from '@/application/ports';
import { filtrarReservas } from '@/infrastructure/shared/filtros';
import { mapearReserva } from './mappers/entidades';
import { lerLista, temConteudo } from './mappers/leitura';
import {
  paraAtualizarReservaRequisicao,
  paraCriarReservaRequisicao,
  paraParametros,
} from './mappers/requisicoes';

/** /api/reservas */
export function createHttpReservaRepository(http: AxiosInstance): ReservaRepository {
  const obterPorId = async (id: number) =>
    mapearReserva((await http.get<unknown>(`/reservas/${id}`)).data);

  return {
    listar: async (filtro = {}) => {
      const { data } = await http.get<unknown>('/reservas', { params: paraParametros(filtro) });
      // Reaplica o filtro localmente caso a API ainda ignore algum parâmetro.
      return filtrarReservas(lerLista(data, 'reservas').map(mapearReserva), filtro);
    },
    obterPorId,
    criar: async (dados) =>
      mapearReserva(
        (await http.post<unknown>('/reservas', paraCriarReservaRequisicao(dados))).data,
      ),
    atualizar: async (id, dados) => {
      const { data } = await http.put<unknown>(
        `/reservas/${id}`,
        paraAtualizarReservaRequisicao(dados),
      );
      return temConteudo(data) ? mapearReserva(data) : obterPorId(id);
    },
    cancelar: async (id) => {
      const { data } = await http.post<unknown>(`/reservas/${id}/cancelar`);
      return temConteudo(data) ? mapearReserva(data) : obterPorId(id);
    },
  };
}
