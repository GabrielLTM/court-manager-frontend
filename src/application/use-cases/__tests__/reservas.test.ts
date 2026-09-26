import { describe, expect, it, vi } from 'vitest';
import { createAppServices, type AppDependencies } from '@/application/createAppServices';
import { AppError } from '@/application/errors';
import type {
  AuthGateway,
  ClienteRepository,
  PagamentoRepository,
  QuadraRepository,
  ReservaRepository,
  SessionStore,
} from '@/application/ports';
import type { Cliente, Pagamento, Quadra, Reserva, Sessao } from '@/domain/entities';
import {
  MetodoPagamento,
  Perfil,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';

/** Testes dos casos de uso isolados da infraestrutura (portas substituídas por dublês). */

const naoUsado = () => vi.fn(() => Promise.reject(new Error('chamada inesperada')));

const quadra: Quadra = {
  id: 1,
  nome: 'Quadra 01',
  tipo: 'Beach Tennis',
  valorHora: 80,
  status: StatusQuadra.Ativa,
};
const cliente: Cliente = {
  id: 1,
  nome: 'Isadora Oliveira',
  cpf: '012.345.678-90',
  email: 'isadora@email.com',
  telefone: '(51) 99812-4477',
  dataNascimento: null,
  status: StatusCliente.Ativo,
};
const reserva = (parcial: Partial<Reserva> = {}): Reserva => ({
  id: 10,
  clienteId: 1,
  quadraId: 1,
  data: '2026-09-21',
  horaInicio: '19:00',
  horaFim: '20:00',
  valor: 80,
  status: StatusReserva.Pendente,
  dataCriacao: '2026-09-20T12:00:00.000Z',
  ...parcial,
});
const sessaoCliente: Sessao = {
  token: 't',
  expiraEm: null,
  usuario: {
    id: 1,
    nome: 'Isadora Oliveira',
    email: 'isadora@email.com',
    perfil: Perfil.Cliente,
    clienteId: 1,
  },
};

function montar(sobrescritas: {
  quadras?: Partial<QuadraRepository>;
  clientes?: Partial<ClienteRepository>;
  reservas?: Partial<ReservaRepository>;
  pagamentos?: Partial<PagamentoRepository>;
}) {
  const quadraRepository: QuadraRepository = {
    listar: vi.fn(async () => [quadra]),
    obterPorId: vi.fn(async () => quadra),
    criar: naoUsado(),
    atualizar: naoUsado(),
    inativar: naoUsado(),
    consultarDisponibilidade: vi.fn(async (quadraId: number, data: string) => ({
      quadraId,
      data,
      abertura: '07:00',
      fechamento: '22:00',
      ocupados: [{ inicio: '19:00', fim: '20:00' }],
    })),
    ...sobrescritas.quadras,
  };
  const clienteRepository: ClienteRepository = {
    listar: naoUsado(),
    obterPorId: vi.fn(async () => cliente),
    criar: naoUsado(),
    atualizar: naoUsado(),
    inativar: naoUsado(),
    ...sobrescritas.clientes,
  };
  const reservaRepository: ReservaRepository = {
    listar: vi.fn(async () => []),
    obterPorId: vi.fn(async () => reserva()),
    criar: vi.fn(async () => reserva()),
    atualizar: vi.fn(async (id: number, dados) => reserva({ id, ...dados })),
    cancelar: naoUsado(),
    ...sobrescritas.reservas,
  };
  const pagamentoRepository: PagamentoRepository = {
    listar: vi.fn(async () => []),
    obterPorId: naoUsado(),
    registrar: naoUsado(),
    confirmar: naoUsado(),
    ...sobrescritas.pagamentos,
  };
  const authGateway: AuthGateway = { login: naoUsado(), registrar: naoUsado() };
  const sessionStore: SessionStore = {
    get: () => sessaoCliente,
    set: vi.fn(),
    subscribe: () => () => undefined,
  };
  const deps: AppDependencies = {
    quadraRepository,
    clienteRepository,
    reservaRepository,
    pagamentoRepository,
    authGateway,
    sessionStore,
    clock: { now: () => new Date(2026, 8, 20, 12, 0) },
  };
  return { services: createAppServices(deps), deps };
}

const novaReserva = {
  clienteId: 99,
  quadraId: 1,
  data: '2026-09-21',
  horaInicio: '18:00', // 18:00–20:00 sobrepõe o horário ocupado 19:00–20:00
  duracaoMinutos: 120,
  metodoPagamento: MetodoPagamento.Pix,
};

describe('ReservaService (dublês)', () => {
  it('pré-valida contra os horários ocupados e não chega a criar a reserva (RN04)', async () => {
    const { services, deps } = montar({});
    await expect(services.reservas.criar(novaReserva)).rejects.toMatchObject({ regra: 'RN04' });
    expect(deps.reservaRepository.criar).not.toHaveBeenCalled();
  });

  it('força o clienteId da sessão e informa quando o pagamento falha após criar a reserva', async () => {
    const { services, deps } = montar({
      pagamentos: {
        registrar: vi.fn(() => Promise.reject(new AppError('fora do ar', { code: 'REDE' }))),
      },
    });
    const promessa = services.reservas.criar({ ...novaReserva, horaInicio: '15:00' });
    await expect(promessa).rejects.toBeInstanceOf(AppError);
    await expect(promessa).rejects.toMatchObject({
      code: 'REDE',
      message:
        'Reserva criada, mas o pagamento não foi registrado. Tente novamente em Minhas reservas.',
    });
    expect(deps.reservaRepository.criar).toHaveBeenCalledWith({
      clienteId: 1,
      quadraId: 1,
      data: '2026-09-21',
      horaInicio: '15:00',
      horaFim: '17:00',
    });
  });

  it('devolve a reserva relida (Confirmada) junto do pagamento', async () => {
    const pagamento: Pagamento = {
      id: 1,
      reservaId: 10,
      valor: 160,
      metodo: MetodoPagamento.Pix,
      status: StatusPagamento.Pago,
      dataPagamento: '2026-09-20T15:00:00.000Z',
    };
    const { services } = montar({
      reservas: { obterPorId: vi.fn(async () => reserva({ status: StatusReserva.Confirmada })) },
      pagamentos: { registrar: vi.fn(async () => pagamento) },
    });
    const resultado = await services.reservas.criar({ ...novaReserva, horaInicio: '15:00' });
    expect(resultado).toEqual({
      reserva: reserva({ status: StatusReserva.Confirmada }),
      pagamento,
    });
  });

  it('para o Cliente, lista só as próprias reservas sem consultar a lista de clientes', async () => {
    const { services, deps } = montar({
      reservas: {
        listar: vi.fn(async () => [
          reserva({ id: 2, data: '2026-09-22' }),
          reserva({ id: 1, horaInicio: '08:00', horaFim: '09:00' }),
        ]),
      },
    });
    const reservas = await services.reservas.listar({ clienteId: 5, data: undefined });
    expect(deps.reservaRepository.listar).toHaveBeenCalledWith({ clienteId: 1, data: undefined });
    expect(deps.pagamentoRepository.listar).toHaveBeenCalledWith({ clienteId: 1 });
    expect(deps.clienteRepository.listar).not.toHaveBeenCalled();
    expect(reservas.map((r) => r.id)).toEqual([1, 2]);
    expect(reservas[0]).toMatchObject({
      duracaoMinutos: 60,
      cliente: { id: 1, nome: 'Isadora Oliveira' },
      quadra,
    });
  });

  it('RF13: ao alterar na mesma quadra/data, o próprio horário não conta como conflito', async () => {
    const { services, deps } = montar({});
    await services.reservas.alterar(10, {
      quadraId: 1,
      data: '2026-09-21',
      horaInicio: '19:30',
      duracaoMinutos: 60,
    });
    expect(deps.reservaRepository.atualizar).toHaveBeenCalledWith(10, {
      quadraId: 1,
      data: '2026-09-21',
      horaInicio: '19:30',
      horaFim: '20:30',
    });
  });
});
