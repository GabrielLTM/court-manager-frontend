import type { NovaReservaInput } from '@/application/dto';
import type { Quadra, Reserva, Slot } from '@/domain/entities';
import { MetodoPagamento } from '@/domain/enums';
import { REGRAS_RESERVA, calcularHoraFim, calcularValorReserva, quadraPodeSerReservada } from '@/domain/rules';
import { formatDataLonga } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva, formatDuracao } from '@/shared/lib/format';

/** Linha chave/valor exibida no resumo e no diálogo de confirmação. */
export interface LinhaDetalhe {
  label: string;
  value: string;
}

/** Escolhas do cliente na tela "Reservar quadra" (passos 1 a 4). */
export interface SelecaoReserva {
  data: string;
  quadraId: number | null;
  duracaoMinutos: number;
  horaInicio: string | null;
}

export type AcaoSelecao =
  | { tipo: 'data'; data: string }
  | { tipo: 'quadra'; quadraId: number }
  | { tipo: 'duracao'; duracaoMinutos: number }
  | { tipo: 'horario'; horaInicio: string | null };

/** Retrato da reserva no momento em que o cliente abre a confirmação. */
export interface ReservaPendente {
  quadra: Quadra;
  data: string;
  horaInicio: string;
  duracaoMinutos: number;
}

export function primeiraQuadraAtiva(quadras: readonly Quadra[]): Quadra | null {
  return quadras.find(quadraPodeSerReservada) ?? null;
}

/** Estado inicial: hoje, primeira quadra ativa (RN03), 1 hora e nenhum horário escolhido. */
export function selecaoInicial(hoje: string, quadras: readonly Quadra[]): SelecaoReserva {
  return {
    data: hoje,
    quadraId: primeiraQuadraAtiva(quadras)?.id ?? null,
    duracaoMinutos: REGRAS_RESERVA.duracoesMinutos[0],
    horaInicio: null,
  };
}

/** Trocar data, quadra ou duração invalida o horário escolhido (a grade muda). */
export function selecaoReducer(estado: SelecaoReserva, acao: AcaoSelecao): SelecaoReserva {
  switch (acao.tipo) {
    case 'data':
      return acao.data === estado.data ? estado : { ...estado, data: acao.data, horaInicio: null };
    case 'quadra':
      return acao.quadraId === estado.quadraId ? estado : { ...estado, quadraId: acao.quadraId, horaInicio: null };
    case 'duracao':
      return acao.duracaoMinutos === estado.duracaoMinutos
        ? estado
        : { ...estado, duracaoMinutos: acao.duracaoMinutos, horaInicio: null };
    case 'horario':
      return acao.horaInicio === estado.horaInicio ? estado : { ...estado, horaInicio: acao.horaInicio };
  }
}

/** Quadra escolhida; se ela não existir mais na listagem, volta para a primeira ativa. */
export function resolverQuadra(quadras: readonly Quadra[], quadraId: number | null): Quadra | null {
  return quadras.find((q) => q.id === quadraId) ?? primeiraQuadraAtiva(quadras);
}

/** O horário escolhido só vale enquanto continuar livre na grade atual (ex.: após revalidação). */
export function horarioSelecionavel(slots: readonly Slot[] | null | undefined, horaInicio: string | null): string | null {
  if (!horaInicio || !slots) return null;
  return slots.some((slot) => slot.hora === horaInicio && slot.disponivel) ? horaInicio : null;
}

/** "19:00–20:00" (ou o convite para escolher um horário). */
export function descreverHorario(horaInicio: string | null, duracaoMinutos: number): string {
  return horaInicio ? `${horaInicio}–${calcularHoraFim(horaInicio, duracaoMinutos)}` : 'Selecione um horário';
}

/** RN07 — total formatado (valor/hora × duração). */
export function totalDaReserva(quadra: Pick<Quadra, 'valorHora'> | null, duracaoMinutos: number): string {
  return quadra ? formatBRL(calcularValorReserva(quadra.valorHora, duracaoMinutos)) : '—';
}

/** Linhas do card "Resumo da reserva". */
export function linhasResumo({
  quadra,
  data,
  horaInicio,
  duracaoMinutos,
}: {
  quadra: Pick<Quadra, 'valorHora'> | null;
  data: string;
  horaInicio: string | null;
  duracaoMinutos: number;
}): LinhaDetalhe[] {
  return [
    { label: 'Data', value: formatDataLonga(data) },
    { label: 'Horário', value: descreverHorario(horaInicio, duracaoMinutos) },
    { label: 'Duração', value: formatDuracao(duracaoMinutos) },
    { label: 'Valor por hora', value: quadra ? formatBRL(quadra.valorHora) : '—' },
  ];
}

/** Linhas do diálogo "Confirmar reserva". */
export function linhasConfirmacao({ quadra, data, horaInicio, duracaoMinutos }: ReservaPendente): LinhaDetalhe[] {
  return [
    { label: 'Quadra', value: `${quadra.nome} · ${quadra.tipo}` },
    { label: 'Data', value: formatDataLonga(data) },
    { label: 'Horário', value: descreverHorario(horaInicio, duracaoMinutos) },
    { label: 'Total', value: totalDaReserva(quadra, duracaoMinutos) },
  ];
}

/** 7.4 — Pix e Cartão são simulados e aprovados na hora; Dinheiro aguarda o administrador. */
export function montarNovaReserva(
  pendente: ReservaPendente,
  clienteId: number,
  metodoPagamento: MetodoPagamento,
): NovaReservaInput {
  return {
    clienteId,
    quadraId: pendente.quadra.id,
    data: pendente.data,
    horaInicio: pendente.horaInicio,
    duracaoMinutos: pendente.duracaoMinutos,
    metodoPagamento,
  };
}

/** "Reserva RSV-1048 criada — R$ 80,00" */
export function mensagemReservaCriada(reserva: Pick<Reserva, 'id' | 'valor'>): string {
  return `Reserva ${formatCodigoReserva(reserva.id)} criada — ${formatBRL(reserva.valor)}`;
}
