/**
 * Contrato JSON da API REST (docs/api-contract.md), serializado em camelCase pelo
 * System.Text.Json. Enums trafegam como números (mesmos valores do C#); datas "YYYY-MM-DD";
 * horários "HH:mm:ss". Os mapeadores aceitam variações (ver mappers/), mas estes são os formatos
 * canônicos que o frontend envia e espera receber.
 */

/* ───────────── Respostas ───────────── */

export interface QuadraApi {
  id: number;
  nome: string;
  tipo: string;
  valorHora: number;
  status: number;
}

export interface ClienteApi {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string | null;
  status: number;
}

export interface ReservaApi {
  id: number;
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  valor: number;
  status: number;
  dataCriacao: string;
}

export interface PagamentoApi {
  id: number;
  reservaId: number;
  valor: number;
  metodo: number;
  status: number;
  dataPagamento: string | null;
}

export interface DisponibilidadeApi {
  quadraId: number;
  data: string;
  abertura: string;
  fechamento: string;
  ocupados: { inicio: string; fim: string }[];
}

export interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  perfil: 'Cliente' | 'Administrador';
  clienteId?: number | null;
}

export interface AutenticacaoApi {
  token: string;
  expiraEm?: string | null;
  usuario?: UsuarioApi;
}

/* ───────────── Requisições ───────────── */

export interface LoginRequisicao {
  email: string;
  senha: string;
}

export interface RegistroRequisicao {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  senha: string;
}

export interface QuadraRequisicao {
  nome: string;
  tipo: string;
  valorHora: number;
  status: number;
}

export interface ClienteRequisicao {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string | null;
  status: number;
  /** Ausente na edição = mantém a senha atual. */
  senha?: string;
}

export interface CriarReservaRequisicao {
  clienteId: number;
  quadraId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
}

export type AtualizarReservaRequisicao = Omit<CriarReservaRequisicao, 'clienteId'>;

export interface RegistrarPagamentoRequisicao {
  reservaId: number;
  metodo: number;
}
