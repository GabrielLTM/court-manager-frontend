import { CONTAS_DEMO } from '@/config/demo';
import type { Pagamento, Quadra, Reserva } from '@/domain/entities';
import {
  MetodoPagamento,
  Perfil,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';
import { calcularHoraFim, calcularValorReserva } from '@/domain/rules';
import { addDays, combineDateTime, toISODate } from '@/shared/lib/date';
import type { ClienteMock, DadosMock } from './tipos';

/**
 * Dados de demonstração do protótipo, montados RELATIVOS A HOJE: o "hoje" do protótipo é
 * 20/09/2026, então 20/09 → hoje, 21/09 → amanhã, 14/09 → 6 dias atrás, e assim por diante.
 */

const SENHA_CLIENTES = CONTAS_DEMO[Perfil.Cliente].senha;

const QUADRAS: readonly Quadra[] = [
  { id: 1, nome: 'Quadra 01', tipo: 'Beach Tennis', valorHora: 80, status: StatusQuadra.Ativa },
  {
    id: 2,
    nome: 'Quadra 02',
    tipo: 'Beach Tennis',
    valorHora: 80,
    status: StatusQuadra.Manutencao,
  },
  { id: 3, nome: 'Quadra 03', tipo: 'Beach Tennis', valorHora: 90, status: StatusQuadra.Ativa },
  { id: 4, nome: 'Quadra 04', tipo: 'Futevôlei', valorHora: 70, status: StatusQuadra.Ativa },
  { id: 5, nome: 'Quadra 05', tipo: 'Beach Tennis', valorHora: 95, status: StatusQuadra.Ativa },
  { id: 6, nome: 'Quadra 06', tipo: 'Vôlei de praia', valorHora: 70, status: StatusQuadra.Inativa },
];

type ClienteSemente = Omit<ClienteMock, 'senha' | 'status'> & { status?: StatusCliente };

/** CPFs fictícios, porém com dígitos verificadores válidos. */
// prettier-ignore
const CLIENTES: readonly ClienteSemente[] = [
  // Clientes do protótipo (Isadora é a conta de demonstração do perfil Cliente)
  { id: 1, nome: 'Isadora Oliveira', cpf: '012.345.678-90', telefone: '(51) 99812-4477', email: CONTAS_DEMO[Perfil.Cliente].email, dataNascimento: '1998-03-14' },
  { id: 2, nome: 'Gabriel Lessa', cpf: '987.654.321-00', telefone: '(51) 99640-1180', email: 'gabriel@email.com', dataNascimento: '1996-07-22' },
  { id: 3, nome: 'Alexandre De Ávila', cpf: '456.789.123-64', telefone: '(51) 99327-6654', email: 'alexandre@email.com', dataNascimento: '1990-11-05' },
  { id: 4, nome: 'Jeferson Rodrigues', cpf: '321.654.987-91', telefone: '(51) 99105-3390', email: 'jeferson@email.com', dataNascimento: '1993-01-30' },
  { id: 5, nome: 'Marina Duarte', cpf: '159.753.486-25', telefone: '(51) 98874-2015', email: 'marina@email.com', dataNascimento: '1997-06-18', status: StatusCliente.Inativo },
  // Clientes extras (paginação e grade mais cheias)
  { id: 6, nome: 'Bruna Carvalho', cpf: '274.185.963-91', telefone: '(51) 99456-7812', email: 'bruna@email.com', dataNascimento: '1995-04-12' },
  { id: 7, nome: 'Rafael Menezes', cpf: '365.298.147-28', telefone: '(51) 99231-5566', email: 'rafael@email.com', dataNascimento: '1988-09-03' },
  { id: 8, nome: 'Camila Rocha', cpf: '418.529.637-19', telefone: '(51) 99784-3021', email: 'camila@email.com', dataNascimento: '2000-02-27' },
  { id: 9, nome: 'Lucas Fernandes', cpf: '583.716.294-19', telefone: '(51) 99518-9047', email: 'lucas@email.com', dataNascimento: '1992-12-08' },
  { id: 10, nome: 'Patrícia Nunes', cpf: '649.283.751-73', telefone: '(51) 99367-2284', email: 'patricia@email.com', dataNascimento: '1985-05-19' },
  { id: 11, nome: 'Thiago Martins', cpf: '731.864.295-28', telefone: '(51) 99652-7730', email: 'thiago@email.com', dataNascimento: '1999-08-25' },
  { id: 12, nome: 'Juliana Castro', cpf: '852.497.316-19', telefone: '(51) 99873-4159', email: 'juliana@email.com', dataNascimento: '1994-10-31' },
];

interface ReservaSemente {
  id: number;
  clienteId: number;
  quadraId: number;
  /** Dias a partir de hoje. */
  dia: number;
  inicio: string;
  duracao: number;
  status: StatusReserva;
  metodo: MetodoPagamento;
  pagamento: StatusPagamento;
  /** Momento da criação: [dias a partir de hoje, horário]. Sempre no passado e crescente com o id. */
  criadaEm: readonly [number, string];
}

const { Pix, Cartao, Dinheiro } = MetodoPagamento;
const { Pendente, Confirmada, Cancelada, Concluida } = StatusReserva;
const { Pago, Estornado } = StatusPagamento;
const PagPendente = StatusPagamento.Pendente;

// prettier-ignore
const RESERVAS: readonly ReservaSemente[] = [
  // Protótipo: RSV-1041 a RSV-1047 (mesmos cliente/quadra/horário/valor/status)
  { id: 1041, clienteId: 1, quadraId: 1, dia: 0, inicio: '19:00', duracao: 60, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-10, '09:12'] },
  { id: 1042, clienteId: 2, quadraId: 3, dia: 0, inicio: '08:00', duracao: 120, status: Confirmada, metodo: Cartao, pagamento: Pago, criadaEm: [-9, '14:03'] },
  { id: 1043, clienteId: 1, quadraId: 4, dia: 1, inicio: '20:00', duracao: 60, status: Pendente, metodo: Pix, pagamento: PagPendente, criadaEm: [-8, '10:47'] },
  { id: 1044, clienteId: 3, quadraId: 1, dia: 0, inicio: '10:00', duracao: 60, status: Confirmada, metodo: Dinheiro, pagamento: PagPendente, criadaEm: [-8, '19:25'] },
  { id: 1045, clienteId: 4, quadraId: 5, dia: 2, inicio: '18:00', duracao: 90, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-7, '12:30'] },
  { id: 1046, clienteId: 1, quadraId: 3, dia: -6, inicio: '07:00', duracao: 60, status: Concluida, metodo: Pix, pagamento: Pago, criadaEm: [-7, '20:41'] },
  { id: 1047, clienteId: 2, quadraId: 1, dia: 1, inicio: '16:00', duracao: 60, status: Confirmada, metodo: Cartao, pagamento: PagPendente, criadaEm: [-5, '08:55'] },
  // Extras (hoje a hoje+3, quadras ativas, sem conflitos)
  { id: 1048, clienteId: 6, quadraId: 3, dia: 0, inicio: '18:00', duracao: 90, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-4, '13:18'] },
  { id: 1049, clienteId: 7, quadraId: 5, dia: 0, inicio: '20:00', duracao: 120, status: Confirmada, metodo: Cartao, pagamento: Pago, criadaEm: [-4, '21:02'] },
  { id: 1050, clienteId: 8, quadraId: 4, dia: 0, inicio: '17:00', duracao: 60, status: Confirmada, metodo: Dinheiro, pagamento: PagPendente, criadaEm: [-3, '09:40'] },
  { id: 1051, clienteId: 9, quadraId: 1, dia: 1, inicio: '18:00', duracao: 90, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-3, '17:15'] },
  { id: 1052, clienteId: 10, quadraId: 3, dia: 2, inicio: '19:00', duracao: 60, status: Confirmada, metodo: Cartao, pagamento: Pago, criadaEm: [-2, '11:08'] },
  { id: 1053, clienteId: 11, quadraId: 4, dia: 3, inicio: '08:00', duracao: 120, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-2, '19:33'] },
  { id: 1054, clienteId: 12, quadraId: 5, dia: 3, inicio: '17:00', duracao: 60, status: Confirmada, metodo: Dinheiro, pagamento: PagPendente, criadaEm: [-1, '10:21'] },
  { id: 1055, clienteId: 3, quadraId: 1, dia: 2, inicio: '07:00', duracao: 60, status: Cancelada, metodo: Pix, pagamento: Estornado, criadaEm: [-1, '15:47'] },
  { id: 1056, clienteId: 1, quadraId: 5, dia: 3, inicio: '19:00', duracao: 90, status: Confirmada, metodo: Pix, pagamento: Pago, criadaEm: [-1, '20:10'] },
];

export function criarSeed(agora: Date): DadosMock {
  const hoje = toISODate(agora);
  const instante = ([dia, hora]: readonly [number, string], minutosDepois = 0) =>
    new Date(
      combineDateTime(addDays(hoje, dia), hora).getTime() + minutosDepois * 60_000,
    ).toISOString();
  const valorHora = new Map(QUADRAS.map((q) => [q.id, q.valorHora]));

  const reservas: Reserva[] = RESERVAS.map((s) => ({
    id: s.id,
    clienteId: s.clienteId,
    quadraId: s.quadraId,
    data: addDays(hoje, s.dia),
    horaInicio: s.inicio,
    horaFim: calcularHoraFim(s.inicio, s.duracao),
    valor: calcularValorReserva(valorHora.get(s.quadraId) ?? 0, s.duracao),
    status: s.status,
    dataCriacao: instante(s.criadaEm),
  }));

  // Pagamentos 1..N na mesma ordem das reservas; os pagos foram quitados no ato da reserva.
  const pagamentos: Pagamento[] = RESERVAS.map((s, indice) => ({
    id: indice + 1,
    reservaId: s.id,
    valor: reservas[indice].valor,
    metodo: s.metodo,
    status: s.pagamento,
    dataPagamento:
      s.pagamento === Pago || s.pagamento === Estornado ? instante(s.criadaEm, 2) : null,
  }));

  const admin = CONTAS_DEMO[Perfil.Administrador];
  return {
    administradores: [{ id: 1, nome: 'Gabriel Lessa', email: admin.email, senha: admin.senha }],
    clientes: CLIENTES.map((c) => ({
      ...c,
      status: c.status ?? StatusCliente.Ativo,
      senha: SENHA_CLIENTES,
    })),
    quadras: QUADRAS.map((q) => ({ ...q })),
    reservas,
    pagamentos,
  };
}
