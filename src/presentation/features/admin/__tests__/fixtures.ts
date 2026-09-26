import type { PagamentoDetalhado, ReservaDetalhada } from '@/application/dto';
import type { Cliente, Pagamento, Quadra } from '@/domain/entities';
import { MetodoPagamento, StatusCliente, StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';

/** Dados de teste no formato do protótipo ("hoje" = 20/09/2026). */

export function umaQuadra(dados: Partial<Quadra> = {}): Quadra {
  return { id: 1, nome: 'Quadra 01', tipo: 'Beach Tennis', valorHora: 80, status: StatusQuadra.Ativa, ...dados };
}

export const QUADRAS_PROTOTIPO: Quadra[] = [
  umaQuadra(),
  umaQuadra({ id: 2, nome: 'Quadra 02', status: StatusQuadra.Manutencao }),
  umaQuadra({ id: 3, nome: 'Quadra 03', valorHora: 90 }),
  umaQuadra({ id: 4, nome: 'Quadra 04', tipo: 'Futevôlei', valorHora: 70 }),
  umaQuadra({ id: 5, nome: 'Quadra 05', valorHora: 95 }),
  umaQuadra({ id: 6, nome: 'Quadra 06', tipo: 'Vôlei de praia', valorHora: 70, status: StatusQuadra.Inativa }),
];

export function umPagamento(dados: Partial<Pagamento> = {}): Pagamento {
  return {
    id: 1,
    reservaId: 1041,
    valor: 80,
    metodo: MetodoPagamento.Pix,
    status: StatusPagamento.Pago,
    dataPagamento: '2026-09-10T12:14:00.000Z',
    ...dados,
  };
}

export function umaReserva(dados: Partial<ReservaDetalhada> = {}): ReservaDetalhada {
  return {
    id: 1041,
    clienteId: 1,
    quadraId: 1,
    data: '2026-09-20',
    horaInicio: '19:00',
    horaFim: '20:00',
    valor: 80,
    status: StatusReserva.Confirmada,
    dataCriacao: '2026-09-10T12:12:00.000Z',
    duracaoMinutos: 60,
    quadra: umaQuadra(),
    cliente: { id: 1, nome: 'Isadora Oliveira' },
    pagamento: umPagamento(),
    ...dados,
  };
}

export function umPagamentoDetalhado(dados: Partial<PagamentoDetalhado> = {}): PagamentoDetalhado {
  const reserva = umaReserva();
  return {
    ...umPagamento(),
    reserva,
    quadra: reserva.quadra,
    cliente: reserva.cliente,
    ...dados,
  };
}

export function umCliente(dados: Partial<Cliente> = {}): Cliente {
  return {
    id: 1,
    nome: 'Isadora Oliveira',
    cpf: '012.345.678-90',
    email: 'isadora@email.com',
    telefone: '(51) 99812-4477',
    dataNascimento: '1998-03-14',
    status: StatusCliente.Ativo,
    ...dados,
  };
}
