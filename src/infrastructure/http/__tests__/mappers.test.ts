import { describe, expect, it } from 'vitest';
import {
  MetodoPagamento,
  Perfil,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';
import { codificarBase64Url } from '@/infrastructure/shared/jwt';
import type {
  AutenticacaoApi,
  ClienteApi,
  DisponibilidadeApi,
  PagamentoApi,
  QuadraApi,
  ReservaApi,
} from '../dto';
import {
  mapearCliente,
  mapearDisponibilidade,
  mapearPagamento,
  mapearQuadra,
  mapearReserva,
} from '../mappers/entidades';
import { lerLista } from '../mappers/leitura';
import { paraCriarReservaRequisicao, paraParametros } from '../mappers/requisicoes';
import { mapearSessao } from '../mappers/sessao';

const jwt = (claims: Record<string, unknown>) =>
  `${codificarBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${codificarBase64Url(JSON.stringify(claims))}.assinatura`;

describe('mapeadores tolerantes da API', () => {
  it('formato canônico da reserva', () => {
    const json: ReservaApi = {
      id: 1041,
      clienteId: 1,
      quadraId: 1,
      data: '2026-09-20',
      horaInicio: '19:00:00',
      horaFim: '20:00:00',
      valor: 80,
      status: 2,
      dataCriacao: '2026-09-10T09:12:00',
    };
    expect(mapearReserva(json)).toEqual({
      ...json,
      horaInicio: '19:00',
      horaFim: '20:00',
      status: StatusReserva.Confirmada,
    });
  });

  it('formatos canônicos de quadra, cliente, pagamento e disponibilidade', () => {
    const quadra: QuadraApi = {
      id: 2,
      nome: 'Quadra 02',
      tipo: 'Beach Tennis',
      valorHora: 80,
      status: 3,
    };
    const cliente: ClienteApi = {
      id: 1,
      nome: 'Isadora Oliveira',
      cpf: '012.345.678-90',
      email: 'isadora@email.com',
      telefone: '(51) 99812-4477',
      dataNascimento: '1998-03-14',
      status: 1,
    };
    const pagamento: PagamentoApi = {
      id: 1,
      reservaId: 1041,
      valor: 80,
      metodo: 1,
      status: 2,
      dataPagamento: '2026-09-10T12:14:00Z',
    };
    const disponibilidade: DisponibilidadeApi = {
      quadraId: 1,
      data: '2026-09-20',
      abertura: '07:00',
      fechamento: '22:00',
      ocupados: [{ inicio: '19:00', fim: '20:00' }],
    };
    expect(mapearQuadra(quadra)).toEqual({ ...quadra, status: StatusQuadra.Manutencao });
    expect(mapearCliente(cliente)).toEqual({ ...cliente, status: StatusCliente.Ativo });
    expect(mapearPagamento(pagamento)).toEqual({
      ...pagamento,
      metodo: MetodoPagamento.Pix,
      status: StatusPagamento.Pago,
    });
    expect(mapearDisponibilidade(disponibilidade, { quadraId: 1, data: '2026-09-20' })).toEqual(
      disponibilidade,
    );
  });

  it('chaves sem diferenciar maiúsculas, enums por nome e DateTime/TimeOnly do .NET', () => {
    const reserva = mapearReserva({
      Id: 7,
      ClienteID: 3,
      QuadraId: '2',
      Data: '2026-09-21T00:00:00',
      hora_inicio: '07:30:00.0000000',
      HoraFim: '09:00:00',
      Valor: '120.50',
      Status: 'CONCLUÍDA',
      DataCriacao: '2026-09-10T09:12:00.1234567',
    });
    expect(reserva).toEqual({
      id: 7,
      clienteId: 3,
      quadraId: 2,
      data: '2026-09-21',
      horaInicio: '07:30',
      horaFim: '09:00',
      valor: 120.5,
      status: StatusReserva.Concluida,
      dataCriacao: '2026-09-10T09:12:00.123',
    });
  });

  it('StatusQuadra do backend usa Ativo/Inativo; aceita também "Manutenção" e booleanos', () => {
    const base = { id: 1, nome: 'Quadra 01', tipo: 'Beach Tennis', valorHora: 80 };
    expect(mapearQuadra({ ...base, status: 'Ativo' }).status).toBe(StatusQuadra.Ativa);
    expect(mapearQuadra({ ...base, status: 'Manutenção' }).status).toBe(StatusQuadra.Manutencao);
    expect(mapearQuadra({ ...base, STATUS: 3 }).status).toBe(StatusQuadra.Manutencao);
    expect(mapearQuadra({ ...base, status: false }).status).toBe(StatusQuadra.Inativa);
  });

  it('cliente: CPF/telefone formatados, bool ClienteAtivo e DateOnly', () => {
    expect(
      mapearCliente({
        Id: 2,
        Nome: 'Gabriel Lessa',
        Cpf: '98765432100',
        Telefone: 51996401180,
        Email: 'gabriel@email.com',
        DataNascimento: '1996-07-22',
        ClienteAtivo: true,
      }),
    ).toEqual({
      id: 2,
      nome: 'Gabriel Lessa',
      cpf: '987.654.321-00',
      telefone: '(51) 99640-1180',
      email: 'gabriel@email.com',
      dataNascimento: '1996-07-22',
      status: StatusCliente.Ativo,
    });
  });

  it('pagamento: método por nome com acento e DateTime padrão do .NET como nulo', () => {
    expect(
      mapearPagamento({
        id: 1,
        reservaId: 1041,
        valor: 80,
        metodo: 'Cartão',
        status: 'pago',
        dataPagamento: '0001-01-01T00:00:00',
      }),
    ).toEqual({
      id: 1,
      reservaId: 1041,
      valor: 80,
      metodo: MetodoPagamento.Cartao,
      status: StatusPagamento.Pago,
      dataPagamento: null,
    });
  });

  it('resposta inesperada vira AppError legível', () => {
    expect(() => mapearQuadra({ id: 1, nome: 'Quadra', valorHora: 80, status: 'Fechada' })).toThrow(
      'Resposta inesperada do servidor (quadra.status).',
    );
    expect(lerLista({ $id: '1', $values: [1, 2] }, 'quadras')).toEqual([1, 2]);
  });

  it('disponibilidade: formato canônico ou lista de reservas', () => {
    const consulta = { quadraId: 1, data: '2026-09-20' };
    expect(
      mapearDisponibilidade(
        {
          quadraId: 1,
          data: '2026-09-20',
          abertura: '07:00:00',
          fechamento: '22:00:00',
          ocupados: [{ inicio: '19:00:00', fim: '20:00:00' }],
        },
        consulta,
      ),
    ).toEqual({
      ...consulta,
      abertura: '07:00',
      fechamento: '22:00',
      ocupados: [{ inicio: '19:00', fim: '20:00' }],
    });

    const lista = [
      {
        id: 1,
        quadraId: 1,
        data: '2026-09-20',
        horaInicio: '19:00:00',
        horaFim: '20:00:00',
        status: 2,
      },
      {
        id: 2,
        quadraId: 1,
        data: '2026-09-20',
        horaInicio: '08:00:00',
        horaFim: '09:00:00',
        status: 'Cancelada',
      },
      {
        id: 3,
        quadraId: 2,
        data: '2026-09-20',
        horaInicio: '10:00:00',
        horaFim: '11:00:00',
        status: 1,
      },
      {
        id: 4,
        quadraId: 1,
        data: '2026-09-20',
        horaInicio: '10:00:00',
        horaFim: '11:30:00',
        status: 1,
      },
    ];
    expect(mapearDisponibilidade(lista, consulta).ocupados).toEqual([
      { inicio: '10:00', fim: '11:30' },
      { inicio: '19:00', fim: '20:00' },
    ]);
  });

  it('sessão com `usuario` explícito', () => {
    const json: AutenticacaoApi = {
      token: 'x.y.z',
      expiraEm: '2026-09-20T23:00:00Z',
      usuario: {
        id: 1,
        nome: 'Isadora Oliveira',
        email: 'isadora@email.com',
        perfil: 'Cliente',
        clienteId: 1,
      },
    };
    expect(mapearSessao(json)).toEqual({ ...json, expiraEm: '2026-09-20T23:00:00.000Z' });
  });

  it('sessão sem `usuario`: dados lidos dos claims do JWT (ClaimTypes do ASP.NET)', () => {
    const token = jwt({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '5',
      unique_name: 'Gabriel Lessa',
      email: 'admin@arena.com',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['Admin'],
      exp: 1_790_000_000,
    });
    expect(mapearSessao({ Token: token })).toEqual({
      token,
      expiraEm: new Date(1_790_000_000 * 1000).toISOString(),
      usuario: {
        id: 5,
        nome: 'Gabriel Lessa',
        email: 'admin@arena.com',
        perfil: Perfil.Administrador,
        clienteId: null,
      },
    });
  });

  it('requisições: horários "HH:mm:ss" e query string sem vazios', () => {
    expect(
      paraCriarReservaRequisicao({
        clienteId: 1,
        quadraId: 2,
        data: '2026-09-20',
        horaInicio: '19:00',
        horaFim: '20:30',
      }),
    ).toEqual({
      clienteId: 1,
      quadraId: 2,
      data: '2026-09-20',
      horaInicio: '19:00:00',
      horaFim: '20:30:00',
    });
    expect(paraParametros({ busca: '  ', status: 1, clienteId: undefined })).toEqual({ status: 1 });
  });
});
