import type {
  MetodoPagamento,
  Perfil,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';

/** Datas: "YYYY-MM-DD" (DateOnly). Horários: "HH:mm" (TimeOnly). Date-times: ISO 8601. */

/** 9.1 Cliente — a senha nunca faz parte do modelo de leitura. */
export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string | null;
  status: StatusCliente;
}

/** 9.2 Quadra */
export interface Quadra {
  id: number;
  nome: string;
  tipo: string;
  valorHora: number;
  status: StatusQuadra;
}

/** 9.3 Reserva */
export interface Reserva {
  id: number;
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: number;
  status: StatusReserva;
  dataCriacao: string;
}

/** 9.4 Pagamento (1:1 com Reserva — RN10). */
export interface Pagamento {
  id: number;
  reservaId: number;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusPagamento;
  dataPagamento: string | null;
}

/** Usuário autenticado (Sprint 5 — JWT). `clienteId` é preenchido para o perfil Cliente. */
export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  clienteId: number | null;
}

export interface Sessao {
  token: string;
  usuario: UsuarioAutenticado;
  expiraEm: string | null;
}

/** Intervalo de horário [inicio, fim) no formato "HH:mm". */
export interface Intervalo {
  inicio: string;
  fim: string;
}

/** Resposta de GET /api/quadras/{id}/disponibilidade?data=YYYY-MM-DD */
export interface Disponibilidade {
  quadraId: number;
  data: string;
  abertura: string;
  fechamento: string;
  ocupados: Intervalo[];
}

export type MotivoIndisponibilidade =
  | 'ocupado'
  | 'passado'
  | 'fora-do-horario'
  | 'fora-da-janela'
  | 'quadra-indisponivel';

/** Horário de início ofertado na tela de reserva para uma duração. */
export interface Slot {
  hora: string;
  fim: string;
  disponivel: boolean;
  motivo?: MotivoIndisponibilidade;
}
