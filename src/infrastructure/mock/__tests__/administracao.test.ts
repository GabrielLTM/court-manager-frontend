import { describe, expect, it } from 'vitest';
import { MetodoPagamento, StatusCliente, StatusPagamento, StatusQuadra } from '@/domain/enums';
import { criarArmazenamentoEmMemoria } from '@/infrastructure/storage/armazenamento';
import { CHAVE_BANCO_MOCK, resetMockDatabase } from '../banco';
import { criarAmbiente, HOJE } from './ambiente';

describe('Administração — autorização e regras no backend simulado', () => {
  it('cliente não lista clientes nem acessa dados de outro cliente (403)', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    await expect(services.clientes.listar()).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
      status: 403,
    });
    await expect(services.clientes.obter(2)).rejects.toMatchObject({ status: 403 });
    await expect(services.dashboard.obterResumo(HOJE)).rejects.toMatchObject({ status: 403 });
    await expect(services.quadras.alterarStatus(2, StatusQuadra.Ativa)).rejects.toMatchObject({
      status: 403,
    });
  });

  it('lista e busca clientes por nome (sem acento), CPF e status', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    expect(await services.clientes.listar()).toHaveLength(12);
    expect((await services.clientes.listar({ busca: 'avila' })).map((c) => c.nome)).toEqual([
      'Alexandre De Ávila',
    ]);
    expect((await services.clientes.listar({ busca: '01234567' })).map((c) => c.id)).toEqual([1]);
    expect(
      (await services.clientes.listar({ status: StatusCliente.Inativo })).map((c) => c.id),
    ).toEqual([5]);
  });

  it('RN01 também vale para a reativação', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    await services.clientes.criar({
      nome: 'Marina Duarte Lima',
      cpf: '15975348625',
      telefone: '(51) 99111-2222',
      email: 'marina.lima@email.com',
      dataNascimento: null,
      senha: '123456',
      status: StatusCliente.Ativo,
    });
    await expect(services.clientes.alterarStatus(5, StatusCliente.Ativo)).rejects.toMatchObject({
      code: 'CONFLITO',
      fieldErrors: { cpf: [expect.stringMatching(/^RN01/)] },
    });
  });

  it('inativar/reativar cliente e quadra (RF04/RF07)', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    expect((await services.clientes.alterarStatus(4, StatusCliente.Inativo)).status).toBe(
      StatusCliente.Inativo,
    );
    expect((await services.clientes.alterarStatus(4, StatusCliente.Ativo)).status).toBe(
      StatusCliente.Ativo,
    );
    expect((await services.quadras.alterarStatus(2, StatusQuadra.Ativa)).status).toBe(
      StatusQuadra.Ativa,
    );
    expect((await services.quadras.alterarStatus(1, StatusQuadra.Inativa)).status).toBe(
      StatusQuadra.Inativa,
    );
    await expect(
      services.quadras.criar({
        nome: 'Quadra 07',
        tipo: 'Beach Tennis',
        valorHora: 0,
        status: StatusQuadra.Ativa,
      }),
    ).rejects.toMatchObject({ regra: 'VALIDACAO' });
    const nova = await services.quadras.criar({
      nome: ' Quadra 07 ',
      tipo: 'Beach Tennis',
      valorHora: 85,
      status: StatusQuadra.Ativa,
    });
    expect(nova).toEqual({
      id: 7,
      nome: 'Quadra 07',
      tipo: 'Beach Tennis',
      valorHora: 85,
      status: StatusQuadra.Ativa,
    });
  });

  it('confirmar pagamento: só pendentes; a confirmação quita o pagamento (RF16)', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    await expect(services.pagamentos.confirmar(1)).rejects.toMatchObject({
      message: 'Somente pagamentos pendentes podem ser confirmados.',
    });
    const pago = await services.pagamentos.confirmar(4);
    expect(pago).toMatchObject({ id: 4, reservaId: 1044, status: StatusPagamento.Pago });
  });

  it('pagamentos detalhados: admin vê todos; cliente só os seus', async () => {
    const { services, entrarComoAdmin, entrarComoCliente } = criarAmbiente();
    await entrarComoAdmin();
    const pendentes = await services.pagamentos.listar({ status: StatusPagamento.Pendente });
    expect(pendentes.map((p) => p.reservaId)).toEqual([1044, 1050, 1047, 1043, 1054]);
    expect(pendentes[0]).toMatchObject({
      metodo: MetodoPagamento.Dinheiro,
      quadra: { nome: 'Quadra 01' },
      cliente: { nome: 'Alexandre De Ávila' },
    });

    await entrarComoCliente();
    const meus = await services.pagamentos.listar();
    expect(meus.map((p) => p.id)).toEqual([6, 1, 3, 16]);
  });

  it('dashboard do dia (Sprint 6)', async () => {
    const { services, entrarComoAdmin } = criarAmbiente();
    await entrarComoAdmin();
    const resumo = await services.dashboard.obterResumo(HOJE);

    expect(resumo).toMatchObject({
      data: HOJE,
      clientesAtivos: 11,
      totalQuadras: 6,
      quadrasAtivas: 4,
      reservasNoDia: 6,
      valorRecebidoNoDia: 585,
    });
    expect(resumo.reservasRecentes.map((r) => r.id)).toEqual([1056, 1055, 1054, 1053, 1052]);
    expect(resumo.reservasRecentes[0]).toMatchObject({
      cliente: { nome: 'Isadora Oliveira' },
      quadra: { id: 5 },
    });
    const ocupacao = Object.fromEntries(
      resumo.ocupacao.map((o) => [o.quadra.id, o.minutosReservados]),
    );
    expect(ocupacao).toEqual({ 1: 120, 2: 0, 3: 210, 4: 60, 5: 120, 6: 0 });
    expect(resumo.ocupacao.find((o) => o.quadra.id === 3)?.percentual).toBe(25);
  });

  it('persiste no armazenamento, devolve cópias e pode ser restaurado', async () => {
    const storage = criarArmazenamentoEmMemoria();
    const primeiro = criarAmbiente(undefined, storage);
    await primeiro.entrarComoAdmin();
    const quadras = await primeiro.services.quadras.listar();
    quadras[0].nome = 'alterada fora do backend';
    await primeiro.services.quadras.criar({
      nome: 'Quadra 07',
      tipo: 'Padel',
      valorHora: 100,
      status: StatusQuadra.Ativa,
    });
    expect(storage.getItem(CHAVE_BANCO_MOCK)).toContain('Quadra 07');

    const segundo = criarAmbiente(undefined, storage);
    await segundo.entrarComoAdmin();
    const vistas = await segundo.services.quadras.listar();
    expect(vistas.map((q) => q.nome)).toContain('Quadra 07');
    expect(vistas[0].nome).toBe('Quadra 01');

    resetMockDatabase();
    expect(await segundo.services.quadras.listar()).toHaveLength(6);
  });
});
