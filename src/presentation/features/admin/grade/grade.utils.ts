import type { ReservaDetalhada } from '@/application/dto';
import type { Quadra, Reserva } from '@/domain/entities';
import { StatusPagamento, StatusQuadra } from '@/domain/enums';
import { REGRAS_RESERVA, quadraPodeSerReservada, reservaOcupaHorario } from '@/domain/rules';
import { formatCodigoReserva, primeiroNome } from '@/shared/lib/format';
import { toMinutes } from '@/shared/lib/time';

interface CelulaBase {
  quadra: Quadra;
  hora: string;
  /** Texto visível na célula. */
  rotulo: string;
  /** Nome acessível da célula (aria-label / title). */
  descricao: string;
}

/** Horário livre: o clique apenas informa ("Livre — Quadra 01 às 19:00"). */
export interface CelulaLivre extends CelulaBase {
  tipo: 'livre';
  mensagem: string;
}

/** Quadra em manutenção ou inativa: hachurada, o clique informa o motivo. */
export interface CelulaIndisponivel extends CelulaBase {
  tipo: 'indisponivel';
  mensagem: string;
}

/** Horário coberto por uma reserva não cancelada: o clique abre o detalhe. */
export interface CelulaReservada extends CelulaBase {
  tipo: 'reservada';
  reserva: ReservaDetalhada;
  pago: boolean;
}

export type CelulaGrade = CelulaLivre | CelulaIndisponivel | CelulaReservada;

export interface LinhaGrade {
  hora: string;
  celulas: CelulaGrade[];
}

export interface ParametrosGrade {
  quadras: readonly Quadra[];
  reservas: readonly ReservaDetalhada[];
  data: string;
  horas?: readonly string[];
}

/** "manutenção" | "inativa" — sufixo exibido para quadras que não recebem reservas. */
export function rotuloIndisponibilidade(status: StatusQuadra): string {
  return status === StatusQuadra.Manutencao ? 'manutenção' : 'inativa';
}

/** A reserva [início, fim) cobre o horário da linha? (18:00–19:30 cobre 18:00 e 19:00). */
export function reservaCobreHorario(reserva: Pick<Reserva, 'horaInicio' | 'horaFim'>, hora: string): boolean {
  const minuto = toMinutes(hora);
  return toMinutes(reserva.horaInicio) <= minuto && minuto < toMinutes(reserva.horaFim);
}

function montarCelula(quadra: Quadra, hora: string, reservas: readonly ReservaDetalhada[]): CelulaGrade {
  if (!quadraPodeSerReservada(quadra)) {
    const motivo = rotuloIndisponibilidade(quadra.status);
    return {
      tipo: 'indisponivel',
      quadra,
      hora,
      rotulo: '—',
      descricao: `${quadra.nome} às ${hora} — ${motivo}`,
      mensagem: `${quadra.nome} — ${motivo}`,
    };
  }

  const reserva = reservas.find((r) => r.quadraId === quadra.id && reservaCobreHorario(r, hora));
  if (reserva) {
    const pago = reserva.pagamento?.status === StatusPagamento.Pago;
    const nome = reserva.cliente?.nome;
    return {
      tipo: 'reservada',
      quadra,
      hora,
      reserva,
      pago,
      rotulo: nome ? primeiroNome(nome) : formatCodigoReserva(reserva.id),
      descricao: `${quadra.nome} às ${hora} — ${nome ?? formatCodigoReserva(reserva.id)}, ${
        pago ? 'pago' : 'pagamento pendente'
      }`,
    };
  }

  return {
    tipo: 'livre',
    quadra,
    hora,
    rotulo: '',
    descricao: `${quadra.nome} às ${hora} — livre`,
    mensagem: `Livre — ${quadra.nome} às ${hora}`,
  };
}

/**
 * Modelo da grade de reservas (gradeLinhas do protótipo): uma linha por horário de início e
 * uma célula por quadra. Reservas canceladas não ocupam horário (RN09).
 */
export function montarGrade({
  quadras,
  reservas,
  data,
  horas = REGRAS_RESERVA.horariosInicio,
}: ParametrosGrade): LinhaGrade[] {
  const doDia = reservas.filter((r) => r.data === data && reservaOcupaHorario(r));
  return horas.map((hora) => ({
    hora,
    celulas: quadras.map((quadra) => montarCelula(quadra, hora, doDia)),
  }));
}

/** Quantidade de reservas que ocupam horário na data (canceladas não contam). */
export function contarReservasAtivas(reservas: readonly ReservaDetalhada[], data: string): number {
  return reservas.filter((r) => r.data === data && reservaOcupaHorario(r)).length;
}
