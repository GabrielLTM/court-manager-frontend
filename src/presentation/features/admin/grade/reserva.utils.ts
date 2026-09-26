import type { Disponibilidade, Intervalo, Pagamento, Quadra, Reserva, Slot } from '@/domain/entities';
import { Perfil, StatusPagamento, StatusReserva } from '@/domain/enums';
import {
  REGRAS_RESERVA,
  calcularDuracaoMinutos,
  gerarSlots,
  podeCancelarReserva,
  statusEfetivoDaReserva,
} from '@/domain/rules';
import { toMinutes } from '@/shared/lib/time';

/* ───────────── Detalhe da reserva ───────────── */

export interface AcoesDaReserva {
  /** Status exibido (Confirmada cujo horário já terminou = Concluída). */
  status: StatusReserva;
  podeAlterar: boolean;
  podeCancelar: boolean;
}

/**
 * O que o administrador pode fazer com a reserva no diálogo de detalhe. Alterar (RF13) libera o
 * horário atual, então segue a mesma regra do cancelamento: nada para reservas canceladas ou
 * concluídas (inclusive as que já terminaram).
 */
export function acoesDaReserva(reserva: Reserva, agora: Date): AcoesDaReserva {
  const status = statusEfetivoDaReserva(reserva, agora);
  const { permitido } = podeCancelarReserva({ ...reserva, status }, agora, Perfil.Administrador);
  const encerrada = status === StatusReserva.Cancelada || status === StatusReserva.Concluida;
  return { status, podeAlterar: permitido && !encerrada, podeCancelar: permitido };
}

/** Consequência do cancelamento para o pagamento (Pago → estornado, Pendente → cancelado). */
export function avisoDoPagamentoAoCancelar(pagamento: Pick<Pagamento, 'status'> | null | undefined): string {
  if (pagamento?.status === StatusPagamento.Pago) return 'O pagamento será estornado.';
  if (pagamento?.status === StatusPagamento.Pendente) return 'O pagamento será cancelado.';
  return 'Não há pagamento a estornar.';
}

/* ───────────── Alteração da reserva (RF13) ───────────── */

type ReservaAlteravel = Pick<Reserva, 'quadraId' | 'data' | 'horaInicio' | 'horaFim'>;

/** Duração atual da reserva, se for uma das durações ofertadas (senão, a primeira: 1 hora). */
export function duracaoInicial(reserva: Pick<Reserva, 'horaInicio' | 'horaFim'>): number {
  const duracao = calcularDuracaoMinutos(reserva.horaInicio, reserva.horaFim);
  return REGRAS_RESERVA.duracoesMinutos.includes(duracao) ? duracao : REGRAS_RESERVA.duracoesMinutos[0];
}

/**
 * Remove dos intervalos ocupados o da própria reserva (quando é a mesma quadra e data),
 * para que o horário atual apareça livre na grade de horários.
 */
export function ocupadosSemAReserva(
  ocupados: readonly Intervalo[],
  reserva: ReservaAlteravel,
  quadraId: number,
  data: string,
): Intervalo[] {
  if (reserva.quadraId !== quadraId || reserva.data !== data) return [...ocupados];
  const indice = ocupados.findIndex(
    (o) =>
      toMinutes(o.inicio) === toMinutes(reserva.horaInicio) && toMinutes(o.fim) === toMinutes(reserva.horaFim),
  );
  return indice < 0 ? [...ocupados] : ocupados.filter((_, i) => i !== indice);
}

export interface ParametrosSlotsAlteracao {
  reserva: ReservaAlteravel;
  quadra: Quadra | null;
  data: string;
  duracaoMinutos: number;
  disponibilidade: Pick<Disponibilidade, 'ocupados'>;
  agora: Date;
}

/** Horários de início para a alteração (gerarSlots sem o intervalo da própria reserva). */
export function slotsDaAlteracao({
  reserva,
  quadra,
  data,
  duracaoMinutos,
  disponibilidade,
  agora,
}: ParametrosSlotsAlteracao): Slot[] {
  const ocupados = quadra ? ocupadosSemAReserva(disponibilidade.ocupados, reserva, quadra.id, data) : [];
  return gerarSlots({ quadra, data, duracaoMinutos, ocupados, agora });
}

export interface EscolhaAlteracao {
  quadraId: number | null;
  data: string;
  duracaoMinutos: number;
  horaInicio: string | null;
}

/** Algum dado (quadra, data, horário ou duração) difere da reserva atual? */
export function houveAlteracao(reserva: ReservaAlteravel, escolha: EscolhaAlteracao): boolean {
  return (
    escolha.quadraId !== reserva.quadraId ||
    escolha.data !== reserva.data ||
    escolha.horaInicio !== reserva.horaInicio ||
    escolha.duracaoMinutos !== calcularDuracaoMinutos(reserva.horaInicio, reserva.horaFim)
  );
}

/** O horário escolhido está entre os slots disponíveis? */
export function horarioDisponivel(slots: readonly Slot[], hora: string | null): boolean {
  return hora !== null && slots.some((slot) => slot.hora === hora && slot.disponivel);
}
