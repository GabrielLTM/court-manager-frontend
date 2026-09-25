import type { Cliente, Pagamento, Quadra, Reserva } from '@/domain/entities';
import type {
  MetodoPagamento,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';

/* ───────────── Autenticação ───────────── */

export interface LoginInput {
  email: string;
  senha: string;
}

/** POST /api/auth/register — autocadastro do cliente (RF01). */
export interface RegistrarClienteInput {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  senha: string;
}

/* ───────────── Clientes ───────────── */

export interface ClienteFiltro {
  /** Busca por nome, CPF ou e-mail. */
  busca?: string;
  status?: StatusCliente;
}

/** POST /api/clientes (admin — RF01). */
export interface NovoClienteInput {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  senha: string;
  status: StatusCliente;
}

/** PUT /api/clientes/{id} (RF02). `senha` vazia/ausente mantém a senha atual. */
export interface AtualizarClienteInput {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  status: StatusCliente;
  senha?: string;
}

/** Atualização dos próprios dados pelo cliente logado (RF02). */
export type AtualizarPerfilInput = Omit<AtualizarClienteInput, 'status'>;

/* ───────────── Quadras ───────────── */

/** POST/PUT /api/quadras (RF05/RF06). */
export interface QuadraInput {
  nome: string;
  tipo: string;
  valorHora: number;
  status: StatusQuadra;
}

/* ───────────── Reservas ───────────── */

export interface ReservaFiltro {
  clienteId?: number;
  quadraId?: number;
  data?: string;
  status?: StatusReserva;
}

/** Dados enviados ao repositório (POST /api/reservas). */
export interface CriarReservaDados {
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
}

/** Dados enviados ao repositório (PUT /api/reservas/{id}). */
export interface AtualizarReservaDados {
  quadraId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
}

/** Caso de uso "reservar quadra" (RF09 + RF14): cria a reserva e registra o pagamento. */
export interface NovaReservaInput {
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  duracaoMinutos: number;
  metodoPagamento: MetodoPagamento;
}

/** RF13 — alteração de data/horário/quadra de uma reserva. */
export interface AlterarReservaInput {
  quadraId: number;
  data: string;
  horaInicio: string;
  duracaoMinutos: number;
}

/** Reserva enriquecida para exibição (join feito na camada de aplicação). */
export interface ReservaDetalhada extends Reserva {
  duracaoMinutos: number;
  quadra: Quadra | null;
  cliente: Pick<Cliente, 'id' | 'nome'> | null;
  pagamento: Pagamento | null;
}

/* ───────────── Pagamentos ───────────── */

export interface PagamentoFiltro {
  status?: StatusPagamento;
  clienteId?: number;
  reservaId?: number;
}

/** POST /api/pagamentos (RF14). */
export interface RegistrarPagamentoInput {
  reservaId: number;
  metodo: MetodoPagamento;
}

export interface PagamentoDetalhado extends Pagamento {
  reserva: Reserva | null;
  quadra: Quadra | null;
  cliente: Pick<Cliente, 'id' | 'nome'> | null;
}

/* ───────────── Dashboard (Sprint 6) ───────────── */

export interface OcupacaoQuadra {
  quadra: Quadra;
  minutosReservados: number;
  /** 0–100, sobre o total de minutos de funcionamento do dia. */
  percentual: number;
}

export interface ResumoDashboard {
  data: string;
  clientesAtivos: number;
  totalQuadras: number;
  quadrasAtivas: number;
  /** Reservas não canceladas na data. */
  reservasNoDia: number;
  /** Soma dos pagamentos Pagos das reservas da data. */
  valorRecebidoNoDia: number;
  /** Últimas 5 reservas criadas (mais recentes primeiro). */
  reservasRecentes: ReservaDetalhada[];
  ocupacao: OcupacaoQuadra[];
}
