import { describe, expect, it } from 'vitest';
import { MetodoPagamento, StatusPagamento, StatusReserva } from '@/domain/enums';
import { AMANHA, criarAmbiente, HOJE } from './ambiente';

const ISADORA = 1;

describe('Reservas — casos de uso + backend simulado', () => {
  it('Pix: reserva Confirmada e pagamento Pago, com valor calculado no servidor (RN07)', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();

    const { reserva, pagamento } = await services.reservas.criar({
      clienteId: ISADORA,
      quadraId: 1,
      data: HOJE,
      horaInicio: '14:00',
      duracaoMinutos: 120,
      metodoPagamento: MetodoPagamento.Pix,
    });

    expect(reserva).toMatchObject({
      clienteId: ISADORA,
      quadraId: 1,
      data: HOJE,
      horaInicio: '14:00',
      horaFim: '16:00',
      valor: 160,
      status: StatusReserva.Confirmada,
    });
    expect(reserva.id).toBe(1057);
    expect(pagamento).toMatchObject({
      reservaId: reserva.id,
      valor: 160,
      status: StatusPagamento.Pago,
    });
    expect(pagamento.dataPagamento).not.toBeNull();
  });

  it('Dinheiro: pagamento Pendente até o administrador confirmar (RF16)', async () => {
    const { services, entrarComoCliente, entrarComoAdmin } = criarAmbiente();
    await entrarComoCliente();
    const { reserva, pagamento } = await services.reservas.criar({
      clienteId: ISADORA,
      quadraId: 3,
      data: HOJE,
      horaInicio: '15:00',
      duracaoMinutos: 60,
      metodoPagamento: MetodoPagamento.Dinheiro,
    });
    expect(reserva.status).toBe(StatusReserva.Confirmada);
    expect(pagamento).toMatchObject({
      status: StatusPagamento.Pendente,
      dataPagamento: null,
      valor: 90,
    });
    await expect(services.pagamentos.confirmar(pagamento.id)).rejects.toMatchObject({
      status: 403,
    });

    await entrarComoAdmin();
    const confirmado = await services.pagamentos.confirmar(pagamento.id);
    expect(confirmado.status).toBe(StatusPagamento.Pago);
    expect(confirmado.dataPagamento).not.toBeNull();
    expect((await services.reservas.obter(reserva.id)).pagamento?.status).toBe(
      StatusPagamento.Pago,
    );
  });

  it('RN03: quadra em manutenção não pode ser reservada', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    const antes = await services.reservas.listar();

    await expect(
      services.reservas.criar({
        clienteId: ISADORA,
        quadraId: 2,
        data: HOJE,
        horaInicio: '14:00',
        duracaoMinutos: 60,
        metodoPagamento: MetodoPagamento.Pix,
      }),
    ).rejects.toMatchObject({
      regra: 'RN03',
      message: 'RN03 — Quadra 02 em manutenção não pode ser reservada.',
    });
    expect(await services.reservas.listar()).toHaveLength(antes.length);
  });

  it('RN04: 19:30–20:30 conflita com a RSV-1041 (19:00–20:00) — na pré-validação e no servidor', async () => {
    const { services, backend, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    const conflitante = { clienteId: ISADORA, quadraId: 1, data: HOJE, horaInicio: '19:30' };

    await expect(
      services.reservas.criar({
        ...conflitante,
        duracaoMinutos: 60,
        metodoPagamento: MetodoPagamento.Pix,
      }),
    ).rejects.toMatchObject({ regra: 'RN04' });
    // O backend revalida mesmo sem a pré-validação do caso de uso (6.3).
    await expect(
      backend.reservaRepository.criar({ ...conflitante, horaFim: '20:30' }),
    ).rejects.toMatchObject({
      regra: 'RN04',
    });
  });

  it('RN08: cliente não cancela a menos de 4h; o administrador pode (e o pagamento é estornado)', async () => {
    const { services, backend, entrarComoCliente, entrarComoAdmin } = criarAmbiente(
      new Date(2026, 8, 20, 16, 0),
    );
    await entrarComoCliente();
    await expect(services.reservas.cancelar(1041)).rejects.toMatchObject({ regra: 'RN08' });
    await expect(backend.reservaRepository.cancelar(1041)).rejects.toMatchObject({ regra: 'RN08' });

    await entrarComoAdmin();
    const cancelada = await services.reservas.cancelar(1041);
    expect(cancelada.status).toBe(StatusReserva.Cancelada);
    expect((await services.reservas.obter(1041)).pagamento?.status).toBe(StatusPagamento.Estornado);
    // RN09: o horário volta a ficar livre.
    const { ocupados } = await services.quadras.consultarDisponibilidade(1, HOJE);
    expect(ocupados).not.toContainEqual({ inicio: '19:00', fim: '20:00' });
  });

  it('cancelamento pelo cliente: pago → Estornado, pendente → Cancelado', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    await services.reservas.cancelar(1056);
    await services.reservas.cancelar(1043);
    const [paga, pendente] = await Promise.all([
      services.reservas.obter(1056),
      services.reservas.obter(1043),
    ]);
    expect(paga).toMatchObject({
      status: StatusReserva.Cancelada,
      pagamento: { status: StatusPagamento.Estornado },
    });
    expect(pendente).toMatchObject({
      status: StatusReserva.Cancelada,
      pagamento: { status: StatusPagamento.Cancelado },
    });
  });

  it('o cliente lista apenas as próprias reservas, detalhadas e em ordem de agenda', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    const reservas = await services.reservas.listar({ clienteId: 2 });

    expect(reservas.map((r) => r.id)).toEqual([1046, 1041, 1043, 1056]);
    expect(reservas.every((r) => r.cliente?.nome === 'Isadora Oliveira')).toBe(true);
    expect(reservas[1]).toMatchObject({
      duracaoMinutos: 60,
      quadra: { nome: 'Quadra 01' },
      pagamento: { metodo: MetodoPagamento.Pix, status: StatusPagamento.Pago },
    });
    expect(reservas[0].status).toBe(StatusReserva.Concluida);
  });

  it('reserva confirmada cujo horário terminou passa a Concluída', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    const doDia = await services.reservas.listar({ data: HOJE });
    const status = Object.fromEntries(doDia.map((r) => [r.id, r.status]));
    expect(status).toMatchObject({
      1042: StatusReserva.Concluida,
      1044: StatusReserva.Concluida,
      1041: StatusReserva.Confirmada,
    });
    expect(doDia[0]).toMatchObject({ id: 1042, cliente: { nome: 'Gabriel Lessa' } });
  });

  it('RF13: alterar ignora o próprio horário e recalcula o valor de um pagamento pendente', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    // RSV-1043: amanhã 20:00–21:00 na Quadra 04 (Pix pendente).
    const alterada = await services.reservas.alterar(1043, {
      quadraId: 4,
      data: AMANHA,
      horaInicio: '19:00',
      duracaoMinutos: 120,
    });
    expect(alterada).toMatchObject({ horaInicio: '19:00', horaFim: '21:00', valor: 140 });
    expect((await services.reservas.obter(1043)).pagamento?.valor).toBe(140);

    // A Quadra 01 já tem a RSV-1047 amanhã às 16:00.
    await expect(
      services.reservas.alterar(1043, {
        quadraId: 1,
        data: AMANHA,
        horaInicio: '16:00',
        duracaoMinutos: 60,
      }),
    ).rejects.toMatchObject({ regra: 'RN04' });
  });

  it('o cliente só reserva para si mesmo', async () => {
    const { services, backend, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    const { reserva } = await services.reservas.criar({
      clienteId: 2,
      quadraId: 5,
      data: AMANHA,
      horaInicio: '09:00',
      duracaoMinutos: 60,
      metodoPagamento: MetodoPagamento.Cartao,
    });
    expect(reserva.clienteId).toBe(ISADORA);
    await expect(
      backend.reservaRepository.criar({
        clienteId: 2,
        quadraId: 5,
        data: AMANHA,
        horaInicio: '11:00',
        horaFim: '12:00',
      }),
    ).rejects.toMatchObject({ code: 'ACESSO_NEGADO', status: 403 });
    await expect(backend.reservaRepository.listar()).rejects.toMatchObject({ status: 403 });
    await expect(backend.reservaRepository.obterPorId(1042)).rejects.toMatchObject({ status: 403 });
  });

  it('RN10: não registra um segundo pagamento ativo para a mesma reserva', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    await expect(
      services.pagamentos.registrar({ reservaId: 1041, metodo: MetodoPagamento.Pix }),
    ).rejects.toMatchObject({ code: 'CONFLITO', status: 409 });
  });
});
