import type { Cliente, Pagamento, Quadra, Reserva } from '@/domain/entities';
import type { Perfil } from '@/domain/enums';

/** Registro de cliente no banco simulado — a senha nunca sai do "servidor". */
export interface ClienteMock extends Cliente {
  senha: string;
}

export interface AdministradorMock {
  id: number;
  nome: string;
  email: string;
  senha: string;
}

/** Tabelas do banco simulado (persistido em localStorage). */
export interface DadosMock {
  administradores: AdministradorMock[];
  clientes: ClienteMock[];
  quadras: Quadra[];
  reservas: Reserva[];
  pagamentos: Pagamento[];
}

/** Usuário identificado a partir do token JWT da requisição. */
export interface Solicitante {
  usuarioId: number;
  perfil: Perfil;
  clienteId: number | null;
}
