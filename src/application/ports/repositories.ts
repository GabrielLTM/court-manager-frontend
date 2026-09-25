import type {
  AtualizarClienteInput,
  AtualizarReservaDados,
  ClienteFiltro,
  CriarReservaDados,
  NovoClienteInput,
  PagamentoFiltro,
  QuadraInput,
  RegistrarPagamentoInput,
  ReservaFiltro,
} from '@/application/dto';
import type { Cliente, Disponibilidade, Pagamento, Quadra, Reserva } from '@/domain/entities';

/**
 * Portas (interfaces) de acesso a dados. A infraestrutura fornece implementações HTTP
 * (API REST da especificação) e simuladas (mock). Todos os métodos rejeitam com AppError
 * ou DomainError em caso de falha.
 */

export interface QuadraRepository {
  /** GET /api/quadras */
  listar(): Promise<Quadra[]>;
  /** GET /api/quadras/{id} */
  obterPorId(id: number): Promise<Quadra>;
  /** POST /api/quadras */
  criar(input: QuadraInput): Promise<Quadra>;
  /** PUT /api/quadras/{id} */
  atualizar(id: number, input: QuadraInput): Promise<Quadra>;
  /** DELETE /api/quadras/{id} (inativação lógica — RF07) */
  inativar(id: number): Promise<void>;
  /** GET /api/quadras/{id}/disponibilidade?data=YYYY-MM-DD */
  consultarDisponibilidade(quadraId: number, data: string): Promise<Disponibilidade>;
}

export interface ClienteRepository {
  /** GET /api/clientes?busca=&status= */
  listar(filtro?: ClienteFiltro): Promise<Cliente[]>;
  /** GET /api/clientes/{id} */
  obterPorId(id: number): Promise<Cliente>;
  /** POST /api/clientes */
  criar(input: NovoClienteInput): Promise<Cliente>;
  /** PUT /api/clientes/{id} */
  atualizar(id: number, input: AtualizarClienteInput): Promise<Cliente>;
  /** DELETE /api/clientes/{id} (inativação sem excluir histórico — RF04) */
  inativar(id: number): Promise<void>;
}

export interface ReservaRepository {
  /** GET /api/reservas?clienteId=&quadraId=&data=&status= */
  listar(filtro?: ReservaFiltro): Promise<Reserva[]>;
  /** GET /api/reservas/{id} */
  obterPorId(id: number): Promise<Reserva>;
  /** POST /api/reservas — o backend revalida disponibilidade e calcula o valor. */
  criar(dados: CriarReservaDados): Promise<Reserva>;
  /** PUT /api/reservas/{id} */
  atualizar(id: number, dados: AtualizarReservaDados): Promise<Reserva>;
  /** POST /api/reservas/{id}/cancelar */
  cancelar(id: number): Promise<Reserva>;
}

export interface PagamentoRepository {
  /** GET /api/pagamentos?status=&clienteId=&reservaId= */
  listar(filtro?: PagamentoFiltro): Promise<Pagamento[]>;
  /** GET /api/pagamentos/{id} */
  obterPorId(id: number): Promise<Pagamento>;
  /** POST /api/pagamentos */
  registrar(input: RegistrarPagamentoInput): Promise<Pagamento>;
  /** POST /api/pagamentos/{id}/confirmar */
  confirmar(id: number): Promise<Pagamento>;
}
