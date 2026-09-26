import type { OcupacaoQuadra } from '@/application/dto';
import type { DashboardService } from '@/application/services';
import type { Quadra, Reserva } from '@/domain/entities';
import { StatusPagamento } from '@/domain/enums';
import {
  calcularDuracaoMinutos,
  clienteAtivo,
  quadraPodeSerReservada,
  REGRAS_RESERVA,
  reservaOcupaHorario,
} from '@/domain/rules';
import type { AppDependencies } from './dependencies';
import { compararPorCriacaoDesc, criarDetalhador } from './detalharReservas';

const QUANTIDADE_RECENTES = 5;
/** Minutos ofertados por quadra no dia: um bloco de 1h por horário de início da grade. */
const MINUTOS_OFERTADOS_POR_DIA = REGRAS_RESERVA.horariosInicio.length * 60;

/** Sprint 6 — indicadores do dia para o administrador. */
export function createDashboardService(deps: AppDependencies): DashboardService {
  const { clienteRepository, quadraRepository, reservaRepository, pagamentoRepository } = deps;

  return {
    obterResumo: async (data) => {
      const [clientes, quadras, reservas, pagamentos] = await Promise.all([
        clienteRepository.listar(),
        quadraRepository.listar(),
        reservaRepository.listar(),
        pagamentoRepository.listar(),
      ]);
      const reservasDoDia = reservas.filter((r) => r.data === data && reservaOcupaHorario(r));
      const dataDaReserva = new Map(reservas.map((r) => [r.id, r.data]));
      const recebido = pagamentos
        .filter((p) => p.status === StatusPagamento.Pago && dataDaReserva.get(p.reservaId) === data)
        .reduce((soma, p) => soma + p.valor, 0);
      const detalhar = criarDetalhador({ quadras, pagamentos, clientes });

      return {
        data,
        clientesAtivos: clientes.filter(clienteAtivo).length,
        totalQuadras: quadras.length,
        quadrasAtivas: quadras.filter(quadraPodeSerReservada).length,
        reservasNoDia: reservasDoDia.length,
        valorRecebidoNoDia: Math.round(recebido * 100) / 100,
        reservasRecentes: [...reservas]
          .sort(compararPorCriacaoDesc)
          .slice(0, QUANTIDADE_RECENTES)
          .map(detalhar),
        ocupacao: quadras.map((quadra) => calcularOcupacao(quadra, reservasDoDia)),
      };
    },
  };
}

function calcularOcupacao(quadra: Quadra, reservasDoDia: readonly Reserva[]): OcupacaoQuadra {
  const minutosReservados = reservasDoDia
    .filter((r) => r.quadraId === quadra.id)
    .reduce((soma, r) => soma + calcularDuracaoMinutos(r.horaInicio, r.horaFim), 0);
  return {
    quadra,
    minutosReservados,
    percentual: Math.min(100, (minutosReservados / MINUTOS_OFERTADOS_POR_DIA) * 100),
  };
}
