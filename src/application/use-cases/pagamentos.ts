import type { PagamentoDetalhado } from '@/application/dto';
import { MENSAGENS } from '@/application/mensagens';
import type { PagamentoService } from '@/application/services';
import type { Pagamento, Reserva } from '@/domain/entities';
import { DomainError } from '@/domain/errors/DomainError';
import { pagamentoPodeSerConfirmado } from '@/domain/rules';
import type { AppDependencies } from './dependencies';
import { compararPorAgenda } from './detalharReservas';
import { clienteRestrito } from './sessao';

/** RF14–RF16 — pagamentos simulados (registro, confirmação e consulta). */
export function createPagamentoService(deps: AppDependencies): PagamentoService {
  const {
    pagamentoRepository,
    reservaRepository,
    quadraRepository,
    clienteRepository,
    sessionStore,
  } = deps;

  return {
    listar: async (filtro = {}) => {
      const sessao = sessionStore.get();
      const clienteId = clienteRestrito(sessao);
      const [pagamentos, reservas, quadras, clientes] = await Promise.all([
        pagamentoRepository.listar(clienteId === undefined ? filtro : { ...filtro, clienteId }),
        reservaRepository.listar(clienteId === undefined ? {} : { clienteId }),
        quadraRepository.listar(),
        clienteId === undefined || !sessao
          ? clienteRepository.listar()
          : Promise.resolve([{ id: clienteId, nome: sessao.usuario.nome }]),
      ]);
      const reservaPorId = new Map(reservas.map((r) => [r.id, r]));
      const quadraPorId = new Map(quadras.map((q) => [q.id, q]));
      const clientePorId = new Map(clientes.map((c) => [c.id, { id: c.id, nome: c.nome }]));
      return pagamentos
        .map((pagamento): PagamentoDetalhado => {
          const reserva = reservaPorId.get(pagamento.reservaId) ?? null;
          return {
            ...pagamento,
            reserva,
            quadra: reserva ? (quadraPorId.get(reserva.quadraId) ?? null) : null,
            cliente: reserva ? (clientePorId.get(reserva.clienteId) ?? null) : null,
          };
        })
        .sort(compararPorReserva);
    },
    registrar: (input) => pagamentoRepository.registrar(input),
    confirmar: async (id) => {
      const pagamento = await pagamentoRepository.obterPorId(id);
      if (!pagamentoPodeSerConfirmado(pagamento))
        throw new DomainError('VALIDACAO', MENSAGENS.pagamentoNaoPendente);
      return pagamentoRepository.confirmar(id);
    },
  };
}

/** Ordena pela agenda da reserva; pagamentos sem reserva conhecida vão para o fim. */
function compararPorReserva(
  a: Pagamento & { reserva: Reserva | null },
  b: Pagamento & { reserva: Reserva | null },
): number {
  if (a.reserva && b.reserva) return compararPorAgenda(a.reserva, b.reserva) || a.id - b.id;
  if (a.reserva) return -1;
  if (b.reserva) return 1;
  return a.id - b.id;
}
