import type {
  AlterarReservaInput,
  AtualizarClienteInput,
  AtualizarPerfilInput,
  ClienteFiltro,
  LoginInput,
  NovaReservaInput,
  NovoClienteInput,
  PagamentoDetalhado,
  PagamentoFiltro,
  QuadraInput,
  RegistrarClienteInput,
  RegistrarPagamentoInput,
  ReservaDetalhada,
  ReservaFiltro,
  ResumoDashboard,
} from '@/application/dto';
import type { Clock } from '@/application/ports';
import type { Cliente, Disponibilidade, Pagamento, Quadra, Reserva, Sessao } from '@/domain/entities';
import type { StatusCliente, StatusQuadra } from '@/domain/enums';

/**
 * Fachada dos casos de uso consumida pela camada de apresentação (via ServicesProvider).
 * A apresentação NUNCA acessa repositórios/infraestrutura diretamente.
 * Métodos não dependem de `this` (podem ser desestruturados).
 */
export interface AppServices {
  auth: AuthService;
  perfil: PerfilService;
  quadras: QuadraService;
  clientes: ClienteService;
  reservas: ReservaService;
  pagamentos: PagamentoService;
  dashboard: DashboardService;
  clock: Clock;
}

export interface AuthService {
  login(input: LoginInput): Promise<Sessao>;
  registrar(input: RegistrarClienteInput): Promise<Sessao>;
  logout(): void;
  sessaoAtual(): Sessao | null;
  subscribe(listener: () => void): () => void;
}

/** Dados do cliente logado (RF02). Rejeita se o usuário não for Cliente. */
export interface PerfilService {
  obter(): Promise<Cliente>;
  /** Atualiza os dados e sincroniza nome/e-mail da sessão. */
  atualizar(input: AtualizarPerfilInput): Promise<Cliente>;
}

export interface QuadraService {
  listar(): Promise<Quadra[]>;
  obter(id: number): Promise<Quadra>;
  criar(input: QuadraInput): Promise<Quadra>;
  atualizar(id: number, input: QuadraInput): Promise<Quadra>;
  /** RF07 — Ativar / Manutenção / Inativar. */
  alterarStatus(id: number, status: StatusQuadra): Promise<Quadra>;
  consultarDisponibilidade(quadraId: number, data: string): Promise<Disponibilidade>;
}

export interface ClienteService {
  listar(filtro?: ClienteFiltro): Promise<Cliente[]>;
  obter(id: number): Promise<Cliente>;
  criar(input: NovoClienteInput): Promise<Cliente>;
  atualizar(id: number, input: AtualizarClienteInput): Promise<Cliente>;
  /** RF04 — inativar / reativar sem excluir o histórico. */
  alterarStatus(id: number, status: StatusCliente): Promise<Cliente>;
}

export interface ReservaService {
  /** Para o perfil Cliente, sempre restringe às reservas do próprio cliente. */
  listar(filtro?: ReservaFiltro): Promise<ReservaDetalhada[]>;
  obter(id: number): Promise<ReservaDetalhada>;
  /** RF09 + RF14: valida (pré-checagem), cria a reserva e registra o pagamento simulado. */
  criar(input: NovaReservaInput): Promise<{ reserva: Reserva; pagamento: Pagamento }>;
  /** RF13 */
  alterar(id: number, input: AlterarReservaInput): Promise<Reserva>;
  /** RF12 / RN08 */
  cancelar(id: number): Promise<Reserva>;
}

export interface PagamentoService {
  listar(filtro?: PagamentoFiltro): Promise<PagamentoDetalhado[]>;
  /** RF14 — registra pagamento de uma reserva sem pagamento (ou refaz após pendência). */
  registrar(input: RegistrarPagamentoInput): Promise<Pagamento>;
  /** RF16 */
  confirmar(id: number): Promise<Pagamento>;
}

export interface DashboardService {
  obterResumo(data: string): Promise<ResumoDashboard>;
}
