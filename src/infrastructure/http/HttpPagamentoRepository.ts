import type { AxiosInstance } from 'axios';
import type { PagamentoRepository } from '@/application/ports';
import { filtrarPagamentos } from '@/infrastructure/shared/filtros';
import type { RegistrarPagamentoRequisicao } from './dto';
import { mapearPagamento } from './mappers/entidades';
import { lerLista, temConteudo } from './mappers/leitura';
import { paraParametros } from './mappers/requisicoes';

/** /api/pagamentos */
export function createHttpPagamentoRepository(http: AxiosInstance): PagamentoRepository {
  const obterPorId = async (id: number) =>
    mapearPagamento((await http.get<unknown>(`/pagamentos/${id}`)).data);

  return {
    listar: async (filtro = {}) => {
      const { data } = await http.get<unknown>('/pagamentos', { params: paraParametros(filtro) });
      // `clienteId` depende das reservas e fica a cargo da API; status/reservaId são reaplicados.
      return filtrarPagamentos(lerLista(data, 'pagamentos').map(mapearPagamento), filtro);
    },
    obterPorId,
    registrar: async ({ reservaId, metodo }) => {
      const corpo: RegistrarPagamentoRequisicao = { reservaId, metodo };
      return mapearPagamento((await http.post<unknown>('/pagamentos', corpo)).data);
    },
    confirmar: async (id) => {
      const { data } = await http.post<unknown>(`/pagamentos/${id}/confirmar`);
      return temConteudo(data) ? mapearPagamento(data) : obterPorId(id);
    },
  };
}
