import type { Cliente, Intervalo, MotivoIndisponibilidade, Quadra, Reserva, Slot } from '@/domain/entities';
import { Perfil, StatusCliente, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { quadraPodeSerReservada, mensagemQuadraIndisponivel } from '@/domain/rules/quadra.rules';
import { addDays, combineDateTime, diffDays, toISODate } from '@/shared/lib/date';
import { addMinutes, toMinutes } from '@/shared/lib/time';

/** Parâmetros operacionais da arena (protótipo: "07h às 22h", "Reservas até 30 dias à frente"). */
export const REGRAS_RESERVA = {
  abertura: '07:00',
  fechamento: '22:00',
  horariosInicio: [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
  ] as readonly string[],
  duracoesMinutos: [60, 90, 120] as readonly number[],
  janelaDias: 30,
  antecedenciaCancelamentoHoras: 4,
} as const;

export const MOTIVO_INDISPONIBILIDADE_LABEL: Record<MotivoIndisponibilidade, string> = {
  ocupado: 'Horário indisponível nesta quadra',
  passado: 'Este horário já passou',
  'fora-do-horario': 'A reserva ultrapassa o horário de funcionamento (até 22h)',
  'fora-da-janela': 'Reservas até 30 dias à frente',
  'quadra-indisponivel': 'Quadra indisponível para reservas',
};

export function calcularHoraFim(horaInicio: string, duracaoMinutos: number): string {
  return addMinutes(horaInicio, duracaoMinutos);
}

export function calcularDuracaoMinutos(horaInicio: string, horaFim: string): number {
  return toMinutes(horaFim) - toMinutes(horaInicio);
}

/** RN07 — valor = valor por hora da quadra × período reservado (ex.: R$ 80/h × 2h = R$ 160). */
export function calcularValorReserva(valorHora: number, duracaoMinutos: number): number {
  return Math.round(valorHora * (duracaoMinutos / 60) * 100) / 100;
}

/** Intervalos semiabertos [inicio, fim): 19:00–20:00 e 20:00–21:00 não conflitam; 19:30–20:30 conflita. */
export function intervalosSobrepoem(a: Intervalo, b: Intervalo): boolean {
  return toMinutes(a.inicio) < toMinutes(b.fim) && toMinutes(b.inicio) < toMinutes(a.fim);
}

/** RN09 — reserva cancelada não ocupa o horário da quadra. */
export function reservaOcupaHorario(reserva: Pick<Reserva, 'status'>): boolean {
  return reserva.status !== StatusReserva.Cancelada;
}

export interface AlvoConflito {
  quadraId: number;
  data: string;
  inicio: string;
  fim: string;
  ignorarReservaId?: number;
}

/** RN04 / RF10 — uma quadra não pode possuir duas reservas para períodos sobrepostos. */
export function haConflitoDeHorario(reservas: readonly Reserva[], alvo: AlvoConflito): boolean {
  return reservas.some(
    (r) =>
      r.id !== alvo.ignorarReservaId &&
      r.quadraId === alvo.quadraId &&
      r.data === alvo.data &&
      reservaOcupaHorario(r) &&
      intervalosSobrepoem({ inicio: r.horaInicio, fim: r.horaFim }, alvo),
  );
}

/** Intervalos ocupados de uma quadra em uma data (base da resposta de disponibilidade). */
export function intervalosOcupados(reservas: readonly Reserva[], quadraId: number, data: string): Intervalo[] {
  return reservas
    .filter((r) => r.quadraId === quadraId && r.data === data && reservaOcupaHorario(r))
    .map((r) => ({ inicio: r.horaInicio, fim: r.horaFim }))
    .sort((a, b) => toMinutes(a.inicio) - toMinutes(b.inicio));
}

/** Janela de reservas: de hoje até hoje + 29 dias. */
export function janelaDeReserva(hoje: string): { inicio: string; fim: string } {
  return { inicio: hoje, fim: addDays(hoje, REGRAS_RESERVA.janelaDias - 1) };
}

export function dataDentroDaJanela(data: string, hoje: string): boolean {
  const d = diffDays(data, hoje);
  return d >= 0 && d < REGRAS_RESERVA.janelaDias;
}

export function horarioDentroDoFuncionamento(inicio: string, fim: string): boolean {
  return (
    toMinutes(inicio) >= toMinutes(REGRAS_RESERVA.abertura) &&
    toMinutes(fim) <= toMinutes(REGRAS_RESERVA.fechamento) &&
    toMinutes(fim) > toMinutes(inicio)
  );
}

export function inicioDaReserva(reserva: Pick<Reserva, 'data' | 'horaInicio'>): Date {
  return combineDateTime(reserva.data, reserva.horaInicio);
}

export function fimDaReserva(reserva: Pick<Reserva, 'data' | 'horaFim'>): Date {
  return combineDateTime(reserva.data, reserva.horaFim);
}

/** Uma reserva confirmada cujo horário já terminou é considerada Concluída. */
export function statusEfetivoDaReserva(reserva: Reserva, agora: Date): StatusReserva {
  if (reserva.status === StatusReserva.Confirmada && fimDaReserva(reserva) <= agora) {
    return StatusReserva.Concluida;
  }
  return reserva.status;
}

export interface ResultadoPermissao {
  permitido: boolean;
  motivo?: string;
}

/**
 * RN08 / RF12 — o cliente pode cancelar até 4 horas antes do início da reserva.
 * O administrador pode cancelar qualquer reserva que ainda não aconteceu.
 */
export function podeCancelarReserva(
  reserva: Pick<Reserva, 'status' | 'data' | 'horaInicio' | 'horaFim'>,
  agora: Date,
  perfil: Perfil,
): ResultadoPermissao {
  if (reserva.status === StatusReserva.Cancelada) return { permitido: false, motivo: 'A reserva já está cancelada.' };
  if (reserva.status === StatusReserva.Concluida || fimDaReserva(reserva) <= agora) {
    return { permitido: false, motivo: 'Reservas concluídas não podem ser canceladas.' };
  }
  if (perfil === Perfil.Administrador) return { permitido: true };
  const limite = inicioDaReserva(reserva).getTime() - REGRAS_RESERVA.antecedenciaCancelamentoHoras * 3_600_000;
  if (agora.getTime() > limite) {
    return {
      permitido: false,
      motivo: `RN08 — o cancelamento é permitido até ${REGRAS_RESERVA.antecedenciaCancelamentoHoras} horas antes do horário da reserva.`,
    };
  }
  return { permitido: true };
}

export interface ParametrosSlots {
  quadra: Pick<Quadra, 'status'> | null | undefined;
  data: string;
  duracaoMinutos: number;
  ocupados: readonly Intervalo[];
  agora: Date;
}

/** RF10 — calcula quais horários de início estão livres para a duração escolhida. */
export function gerarSlots({ quadra, data, duracaoMinutos, ocupados, agora }: ParametrosSlots): Slot[] {
  const hoje = toISODate(agora);
  return REGRAS_RESERVA.horariosInicio.map((hora) => {
    const fim = calcularHoraFim(hora, duracaoMinutos);
    let motivo: MotivoIndisponibilidade | undefined;
    if (!quadra || !quadraPodeSerReservada(quadra)) motivo = 'quadra-indisponivel';
    else if (!dataDentroDaJanela(data, hoje)) motivo = diffDays(data, hoje) < 0 ? 'passado' : 'fora-da-janela';
    else if (combineDateTime(data, hora) <= agora) motivo = 'passado';
    else if (!horarioDentroDoFuncionamento(hora, fim)) motivo = 'fora-do-horario';
    else if (ocupados.some((o) => intervalosSobrepoem(o, { inicio: hora, fim }))) motivo = 'ocupado';
    return motivo ? { hora, fim, disponivel: false, motivo } : { hora, fim, disponivel: true };
  });
}

export interface DadosValidacaoReserva {
  quadra: Quadra | null | undefined;
  cliente: Pick<Cliente, 'status'> | null | undefined;
  data: string;
  horaInicio: string;
  duracaoMinutos: number;
  reservasExistentes: readonly Reserva[];
  agora: Date;
  ignorarReservaId?: number;
}

/**
 * Validação completa de uma nova reserva (ou alteração — RF13). Usada pelo backend simulado e
 * pela UI como pré-validação; o backend real deve revalidar tudo no momento da criação (6.3).
 * Lança DomainError na primeira regra violada e devolve o horário final e o valor (RN07).
 */
export function validarReserva(dados: DadosValidacaoReserva): { horaFim: string; valor: number } {
  const { quadra, cliente, data, horaInicio, duracaoMinutos, agora } = dados;
  if (!cliente) throw new DomainError('RN05', 'RN05 — toda reserva deve estar associada a um cliente.');
  if (cliente.status !== StatusCliente.Ativo) {
    throw new DomainError('RN05', 'Cliente inativo não pode realizar reservas.');
  }
  if (!quadra) throw new DomainError('RN06', 'RN06 — toda reserva deve estar associada a uma quadra.');
  if (!quadraPodeSerReservada(quadra)) throw new DomainError('RN03', mensagemQuadraIndisponivel(quadra));
  if (!REGRAS_RESERVA.duracoesMinutos.includes(duracaoMinutos)) {
    throw new DomainError('VALIDACAO', 'Duração inválida. Escolha 1 hora, 1h30 ou 2 horas.');
  }
  if (!dataDentroDaJanela(data, toISODate(agora))) {
    throw new DomainError('VALIDACAO', 'As reservas podem ser feitas de hoje até 30 dias à frente.');
  }
  const horaFim = calcularHoraFim(horaInicio, duracaoMinutos);
  if (!horarioDentroDoFuncionamento(horaInicio, horaFim)) {
    throw new DomainError('VALIDACAO', 'O horário da reserva deve estar entre 07:00 e 22:00.');
  }
  if (combineDateTime(data, horaInicio) <= agora) {
    throw new DomainError('VALIDACAO', 'Não é possível reservar um horário que já passou.');
  }
  const conflito = haConflitoDeHorario(dados.reservasExistentes, {
    quadraId: quadra.id,
    data,
    inicio: horaInicio,
    fim: horaFim,
    ignorarReservaId: dados.ignorarReservaId,
  });
  if (conflito) throw new DomainError('RN04', 'RN04 — já existe uma reserva para esta quadra neste horário.');
  return { horaFim, valor: calcularValorReserva(quadra.valorHora, duracaoMinutos) };
}
