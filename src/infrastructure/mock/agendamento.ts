import type { CriarReservaDados } from '@/application/dto';
import { DomainError } from '@/domain/errors/DomainError';
import { calcularDuracaoMinutos, validarReserva } from '@/domain/rules';
import { isISODate } from '@/shared/lib/date';
import { normalizeTime } from '@/shared/lib/time';
import type { DadosMock } from './tipos';

const HORARIO = /^\d{1,2}:\d{2}(:\d{2})?$/;

/**
 * Validação de servidor de um agendamento (criação ou alteração — RF13): RN03, RN04, RN05, RN06,
 * janela, funcionamento e horário passado via `validarReserva`. O valor é sempre calculado aqui
 * a partir do valor/hora da quadra (RN07) — nunca aceito do cliente.
 */
export function validarAgendamento(
  dados: DadosMock,
  agendamento: CriarReservaDados,
  agora: Date,
  ignorarReservaId?: number,
): { horaInicio: string; horaFim: string; valor: number } {
  if (!isISODate(agendamento.data)) throw new DomainError('VALIDACAO', 'Data inválida.');
  if (!HORARIO.test(agendamento.horaInicio) || !HORARIO.test(agendamento.horaFim)) {
    throw new DomainError('VALIDACAO', 'Horário inválido.');
  }
  const horaInicio = normalizeTime(agendamento.horaInicio);
  const { horaFim, valor } = validarReserva({
    quadra: dados.quadras.find((q) => q.id === agendamento.quadraId),
    cliente: dados.clientes.find((c) => c.id === agendamento.clienteId),
    data: agendamento.data,
    horaInicio,
    duracaoMinutos: calcularDuracaoMinutos(horaInicio, normalizeTime(agendamento.horaFim)),
    reservasExistentes: dados.reservas,
    agora,
    ignorarReservaId,
  });
  return { horaInicio, horaFim, valor };
}
