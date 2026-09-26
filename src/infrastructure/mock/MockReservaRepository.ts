import type { ReservaRepository } from '@/application/ports';
import {
  verificarAlteracaoPermitida,
  verificarCancelamentoPermitido,
} from '@/application/use-cases/validacaoReserva';
import type { Reserva } from '@/domain/entities';
import { StatusPagamento, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { statusDoPagamentoAoCancelarReserva } from '@/domain/rules';
import { filtrarReservas } from '@/infrastructure/shared/filtros';
import { validarAgendamento } from './agendamento';
import { exigirAcessoAoCliente, restringirAoCliente } from './autorizacao';
import { buscarReserva, pagamentoAtivoDaReserva, porId, proximoId } from './consultas';
import type { ContextoMock } from './contexto';

const SEM_ACESSO = 'Você só pode acessar as suas próprias reservas.';

/** /api/reservas — o cliente opera somente as próprias reservas; o administrador, todas. */
export function createMockReservaRepository({
  executar,
  autorizacao,
}: ContextoMock): ReservaRepository {
  return {
    listar: (filtro = {}) =>
      executar((dados) => {
        const efetivo = restringirAoCliente(autorizacao.autenticar(), filtro, SEM_ACESSO);
        return filtrarReservas(dados.reservas, efetivo).sort(porId);
      }),
    obterPorId: (id) =>
      executar((dados) => {
        const solicitante = autorizacao.autenticar();
        const reserva = buscarReserva(dados, id);
        exigirAcessoAoCliente(solicitante, reserva.clienteId, SEM_ACESSO);
        return reserva;
      }),
    criar: (agendamento) =>
      executar((dados, agora) => {
        exigirAcessoAoCliente(
          autorizacao.autenticar(),
          agendamento.clienteId,
          'Você só pode fazer reservas para o seu próprio cadastro.',
        );
        const { horaInicio, horaFim, valor } = validarAgendamento(dados, agendamento, agora);
        const reserva: Reserva = {
          id: proximoId(dados.reservas),
          clienteId: agendamento.clienteId,
          quadraId: agendamento.quadraId,
          data: agendamento.data,
          horaInicio,
          horaFim,
          valor,
          status: StatusReserva.Pendente,
          dataCriacao: agora.toISOString(),
        };
        dados.reservas.push(reserva);
        return reserva;
      }),
    atualizar: (id, alteracao) =>
      executar((dados, agora) => {
        const solicitante = autorizacao.autenticar();
        const reserva = buscarReserva(dados, id);
        exigirAcessoAoCliente(solicitante, reserva.clienteId, SEM_ACESSO);
        verificarAlteracaoPermitida(reserva, agora, solicitante.perfil);
        const { horaInicio, horaFim, valor } = validarAgendamento(
          dados,
          { ...alteracao, clienteId: reserva.clienteId },
          agora,
          id,
        );
        const pagamento = pagamentoAtivoDaReserva(dados, id);
        if (pagamento && pagamento.valor !== valor) {
          if (pagamento.status === StatusPagamento.Pago) {
            throw new DomainError(
              'RN07',
              'RN07 — a alteração muda o valor de uma reserva já paga. Cancele-a e faça uma nova reserva.',
            );
          }
          pagamento.valor = valor;
        }
        Object.assign(reserva, {
          quadraId: alteracao.quadraId,
          data: alteracao.data,
          horaInicio,
          horaFim,
          valor,
        });
        return reserva;
      }),
    cancelar: (id) =>
      executar((dados, agora) => {
        const solicitante = autorizacao.autenticar();
        const reserva = buscarReserva(dados, id);
        exigirAcessoAoCliente(solicitante, reserva.clienteId, SEM_ACESSO);
        verificarCancelamentoPermitido(reserva, agora, solicitante.perfil);
        reserva.status = StatusReserva.Cancelada; // RN09: o horário volta a ficar livre
        const pagamento = pagamentoAtivoDaReserva(dados, id);
        if (pagamento) pagamento.status = statusDoPagamentoAoCancelarReserva(pagamento.status);
        return reserva;
      }),
  };
}
