import type { Intervalo, Reserva } from '@/domain/entities';
import { type Perfil, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { podeCancelarReserva, validarReserva } from '@/domain/rules';
import { normalizeTime } from '@/shared/lib/time';
import type { AppDependencies } from './dependencies';

export interface AgendamentoReserva {
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  duracaoMinutos: number;
}

/**
 * Pré-validação no cliente (6.3): consulta quadra, cliente e disponibilidade e aplica as mesmas
 * regras do domínio (RN03, RN04, RN05, janela de 30 dias, funcionamento e horário passado).
 * O backend revalida tudo no momento da gravação. `intervaloProprio` (RF13) é desconsiderado
 * no conflito, pois a própria reserva ocupa esse horário.
 */
export async function preValidarReserva(
  deps: Pick<AppDependencies, 'quadraRepository' | 'clienteRepository' | 'clock'>,
  agendamento: AgendamentoReserva,
  intervaloProprio?: Intervalo,
): Promise<{ horaFim: string; valor: number }> {
  const [quadra, cliente, disponibilidade] = await Promise.all([
    deps.quadraRepository.obterPorId(agendamento.quadraId),
    deps.clienteRepository.obterPorId(agendamento.clienteId),
    deps.quadraRepository.consultarDisponibilidade(agendamento.quadraId, agendamento.data),
  ]);
  const ocupados = removerIntervalo(disponibilidade.ocupados, intervaloProprio);
  return validarReserva({
    quadra,
    cliente,
    data: agendamento.data,
    horaInicio: agendamento.horaInicio,
    duracaoMinutos: agendamento.duracaoMinutos,
    reservasExistentes: comoReservas(ocupados, agendamento),
    agora: deps.clock.now(),
  });
}

/** RF12 / RN08 — lança DomainError com o motivo quando o perfil não pode cancelar a reserva. */
export function verificarCancelamentoPermitido(
  reserva: Reserva,
  agora: Date,
  perfil: Perfil,
): void {
  const permissao = podeCancelarReserva(reserva, agora, perfil);
  if (!permissao.permitido) {
    throw new DomainError('RN08', permissao.motivo ?? 'Esta reserva não pode ser cancelada.');
  }
}

/** RF13 — alterar libera o horário atual, por isso segue a mesma janela do cancelamento (RN08). */
export function verificarAlteracaoPermitida(reserva: Reserva, agora: Date, perfil: Perfil): void {
  const permissao = podeCancelarReserva(reserva, agora, perfil);
  if (!permissao.permitido) {
    throw new DomainError(
      'RN08',
      `Esta reserva não pode ser alterada. ${permissao.motivo ?? ''}`.trim(),
    );
  }
}

function removerIntervalo(
  ocupados: readonly Intervalo[],
  alvo: Intervalo | undefined,
): Intervalo[] {
  const lista = [...ocupados];
  if (!alvo) return lista;
  const indice = lista.findIndex(
    (o) =>
      normalizeTime(o.inicio) === normalizeTime(alvo.inicio) &&
      normalizeTime(o.fim) === normalizeTime(alvo.fim),
  );
  if (indice >= 0) lista.splice(indice, 1);
  return lista;
}

/** Adapta os intervalos ocupados ao formato aceito por `validarReserva` (ids negativos: não reais). */
function comoReservas(
  ocupados: readonly Intervalo[],
  alvo: Pick<Reserva, 'quadraId' | 'data'>,
): Reserva[] {
  return ocupados.map((intervalo, indice) => ({
    id: -(indice + 1),
    clienteId: 0,
    quadraId: alvo.quadraId,
    data: alvo.data,
    horaInicio: intervalo.inicio,
    horaFim: intervalo.fim,
    valor: 0,
    status: StatusReserva.Confirmada,
    dataCriacao: '',
  }));
}
