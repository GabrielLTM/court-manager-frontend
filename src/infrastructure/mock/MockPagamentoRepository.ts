import { MENSAGENS } from '@/application/mensagens';
import type { PagamentoRepository } from '@/application/ports';
import type { Pagamento } from '@/domain/entities';
import { METODO_PAGAMENTO_VALUES, StatusPagamento, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import {
  pagamentoPodeSerConfirmado,
  statusDaReservaAposPagamento,
  statusInicialDoPagamento,
} from '@/domain/rules';
import { filtrarPagamentos } from '@/infrastructure/shared/filtros';
import { exigirAcessoAoCliente, restringirAoCliente } from './autorizacao';
import {
  buscarPagamento,
  buscarReserva,
  pagamentoAtivoDaReserva,
  porId,
  proximoId,
} from './consultas';
import type { ContextoMock } from './contexto';
import { conflito } from './erros';

const SEM_ACESSO = 'Você só pode acessar os pagamentos das suas reservas.';

/** /api/pagamentos — pagamento simulado (7.4): Pix/Cartão aprovados na hora, Dinheiro pendente. */
export function createMockPagamentoRepository({
  executar,
  autorizacao,
}: ContextoMock): PagamentoRepository {
  return {
    listar: (filtro = {}) =>
      executar((dados) => {
        const efetivo = restringirAoCliente(autorizacao.autenticar(), filtro, SEM_ACESSO);
        const reservasPorId = new Map(dados.reservas.map((r) => [r.id, r]));
        return filtrarPagamentos(dados.pagamentos, efetivo, reservasPorId).sort(porId);
      }),
    obterPorId: (id) =>
      executar((dados) => {
        const solicitante = autorizacao.autenticar();
        const pagamento = buscarPagamento(dados, id);
        exigirAcessoAoCliente(
          solicitante,
          buscarReserva(dados, pagamento.reservaId).clienteId,
          SEM_ACESSO,
        );
        return pagamento;
      }),
    registrar: ({ reservaId, metodo }) =>
      executar((dados, agora) => {
        const solicitante = autorizacao.autenticar();
        const reserva = buscarReserva(dados, reservaId);
        exigirAcessoAoCliente(solicitante, reserva.clienteId, SEM_ACESSO);
        if (!METODO_PAGAMENTO_VALUES.includes(metodo)) {
          throw new DomainError('VALIDACAO', MENSAGENS.metodoPagamentoInvalido);
        }
        if (reserva.status === StatusReserva.Cancelada) {
          throw new DomainError(
            'VALIDACAO',
            'Não é possível registrar pagamento de uma reserva cancelada.',
          );
        }
        if (pagamentoAtivoDaReserva(dados, reservaId)) {
          throw conflito('RN10 — esta reserva já possui um pagamento registrado.');
        }
        const status = statusInicialDoPagamento(metodo);
        const pagamento: Pagamento = {
          id: proximoId(dados.pagamentos),
          reservaId,
          valor: reserva.valor, // RN07: o valor vem da reserva, calculado pelo servidor
          metodo,
          status,
          dataPagamento: status === StatusPagamento.Pago ? agora.toISOString() : null,
        };
        dados.pagamentos.push(pagamento);
        reserva.status = statusDaReservaAposPagamento(reserva.status);
        return pagamento;
      }),
    confirmar: (id) =>
      executar((dados, agora) => {
        autorizacao.exigirAdministrador();
        const pagamento = buscarPagamento(dados, id);
        if (!pagamentoPodeSerConfirmado(pagamento)) throw conflito(MENSAGENS.pagamentoNaoPendente);
        pagamento.status = StatusPagamento.Pago;
        pagamento.dataPagamento = agora.toISOString();
        const reserva = dados.reservas.find((r) => r.id === pagamento.reservaId);
        if (reserva) reserva.status = statusDaReservaAposPagamento(reserva.status);
        return pagamento;
      }),
  };
}
