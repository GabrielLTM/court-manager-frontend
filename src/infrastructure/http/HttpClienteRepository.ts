import type { AxiosInstance } from 'axios';
import type { ClienteRepository } from '@/application/ports';
import { filtrarClientes } from '@/infrastructure/shared/filtros';
import { mapearCliente } from './mappers/entidades';
import { lerLista, temConteudo } from './mappers/leitura';
import { paraClienteRequisicao, paraParametros } from './mappers/requisicoes';

/** /api/clientes */
export function createHttpClienteRepository(http: AxiosInstance): ClienteRepository {
  const obterPorId = async (id: number) =>
    mapearCliente((await http.get<unknown>(`/clientes/${id}`)).data);

  return {
    listar: async (filtro = {}) => {
      const { data } = await http.get<unknown>('/clientes', { params: paraParametros(filtro) });
      // Reaplica o filtro localmente caso a API ainda ignore `busca`/`status`.
      return filtrarClientes(lerLista(data, 'clientes').map(mapearCliente), filtro);
    },
    obterPorId,
    criar: async (input) =>
      mapearCliente((await http.post<unknown>('/clientes', paraClienteRequisicao(input))).data),
    atualizar: async (id, input) => {
      const { data } = await http.put<unknown>(`/clientes/${id}`, paraClienteRequisicao(input));
      return temConteudo(data) ? mapearCliente(data) : obterPorId(id);
    },
    inativar: async (id) => {
      await http.delete(`/clientes/${id}`);
    },
  };
}
