import { AppError, isAppError } from '@/application/errors';
import { MENSAGENS } from '@/application/mensagens';
import type { PagamentoRepository } from '@/application/ports';
import type { ReservaService } from '@/application/services';
import type { MetodoPagamento } from '@/domain/enums';
import { METODO_PAGAMENTO_VALUES } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import type { Pagamento } from '@/domain/entities';
import { statusDaReservaAposPagamento } from '@/domain/rules';
import type { AppDependencies } from './dependencies';
import { carregarFontesDeDetalhe, compararPorAgenda, criarDetalhador } from './detalharReservas';
import { clienteRestrito, exigirSessao } from './sessao';
import { preValidarReserva, verificarAlteracaoPermitida, verificarCancelamentoPermitido } from './validacaoReserva';

/** RF09–RF14 — consulta, criação (com pagamento), alteração e cancelamento de reservas. */
export function createReservaService(deps: AppDependencies): ReservaService {
  const { reservaRepository, pagamentoRepository, quadraRepository, clienteRepository, sessionStore, clock } = deps;

  return {
    listar: async (filtro = {}) => {
      const sessao = sessionStore.get();
      const clienteId = clienteRestrito(sessao);
      const filtroEfetivo = clienteId === undefined ? filtro : { ...filtro, clienteId };
      const [reservas, fontes] = await Promise.all([
        reservaRepository.listar(filtroEfetivo),
        carregarFontesDeDetalhe(deps, sessao),
      ]);
      return reservas.map(criarDetalhador(fontes)).sort(compararPorAgenda);
    },

    obter: async (id) => {
      const sessao = sessionStore.get();
      const clienteId = clienteRestrito(sessao);
      const [reserva, pagamentos] = await Promise.all([
        reservaRepository.obterPorId(id),
        pagamentoRepository.listar(clienteId === undefined ? { reservaId: id } : { reservaId: id, clienteId }),
      ]);
      const [quadra, cliente] = await Promise.all([
        quadraRepository.obterPorId(reserva.quadraId),
        clienteId === undefined || !sessao
          ? clienteRepository.obterPorId(reserva.clienteId)
          : Promise.resolve({ id: clienteId, nome: sessao.usuario.nome }),
      ]);
      return criarDetalhador({ quadras: [quadra], pagamentos, clientes: [cliente] })(reserva);
    },

    criar: async (input) => {
      const sessao = exigirSessao(sessionStore);
      const clienteId = clienteRestrito(sessao) ?? input.clienteId;
      if (!METODO_PAGAMENTO_VALUES.includes(input.metodoPagamento)) {
        throw new DomainError('VALIDACAO', MENSAGENS.metodoPagamentoInvalido);
      }
      const agendamento = { ...input, clienteId };
      const { horaFim } = await preValidarReserva(deps, agendamento);
      const reserva = await reservaRepository.criar({
        clienteId,
        quadraId: input.quadraId,
        data: input.data,
        horaInicio: input.horaInicio,
        horaFim,
      });
      const pagamento = await registrarPagamento(pagamentoRepository, reserva.id, input.metodoPagamento);
      // Com o pagamento registrado a reserva passa a Confirmada; se a releitura falhar, a reserva
      // já existe — refletimos o novo status localmente em vez de acusar erro.
      const atualizada = await reservaRepository
        .obterPorId(reserva.id)
        .catch(() => ({ ...reserva, status: statusDaReservaAposPagamento(reserva.status) }));
      return { reserva: atualizada, pagamento };
    },

    alterar: async (id, input) => {
      const sessao = exigirSessao(sessionStore);
      const reserva = await reservaRepository.obterPorId(id);
      verificarAlteracaoPermitida(reserva, clock.now(), sessao.usuario.perfil);
      const mesmaAgenda = reserva.quadraId === input.quadraId && reserva.data === input.data;
      const { horaFim } = await preValidarReserva(
        deps,
        { ...input, clienteId: reserva.clienteId },
        mesmaAgenda ? { inicio: reserva.horaInicio, fim: reserva.horaFim } : undefined,
      );
      return reservaRepository.atualizar(id, {
        quadraId: input.quadraId,
        data: input.data,
        horaInicio: input.horaInicio,
        horaFim,
      });
    },

    cancelar: async (id) => {
      const sessao = exigirSessao(sessionStore);
      const reserva = await reservaRepository.obterPorId(id);
      verificarCancelamentoPermitido(reserva, clock.now(), sessao.usuario.perfil);
      return reservaRepository.cancelar(id);
    },
  };
}

async function registrarPagamento(
  pagamentoRepository: PagamentoRepository,
  reservaId: number,
  metodo: MetodoPagamento,
): Promise<Pagamento> {
  try {
    return await pagamentoRepository.registrar({ reservaId, metodo });
  } catch (erro) {
    throw new AppError(MENSAGENS.pagamentoNaoRegistrado, {
      code: isAppError(erro) ? erro.code : 'DESCONHECIDO',
      status: isAppError(erro) ? erro.status : undefined,
      cause: erro,
    });
  }
}
