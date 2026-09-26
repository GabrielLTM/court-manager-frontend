import type { Cliente, Pagamento, Quadra, Reserva } from '@/domain/entities';
import { StatusPagamento } from '@/domain/enums';
import { naoEncontrado } from './erros';
import type { ClienteMock, DadosMock } from './tipos';

/** Consultas auxiliares sobre as tabelas do banco simulado. */

export const proximoId = (registros: readonly { id: number }[]) =>
  registros.reduce((maior, registro) => Math.max(maior, registro.id), 0) + 1;

export const porId = (a: { id: number }, b: { id: number }) => a.id - b.id;

export function buscarQuadra(dados: DadosMock, id: number): Quadra {
  const quadra = dados.quadras.find((q) => q.id === id);
  if (!quadra) throw naoEncontrado('Quadra não encontrada.');
  return quadra;
}

export function buscarCliente(dados: DadosMock, id: number): ClienteMock {
  const cliente = dados.clientes.find((c) => c.id === id);
  if (!cliente) throw naoEncontrado('Cliente não encontrado.');
  return cliente;
}

export function buscarReserva(dados: DadosMock, id: number): Reserva {
  const reserva = dados.reservas.find((r) => r.id === id);
  if (!reserva) throw naoEncontrado('Reserva não encontrada.');
  return reserva;
}

export function buscarPagamento(dados: DadosMock, id: number): Pagamento {
  const pagamento = dados.pagamentos.find((p) => p.id === id);
  if (!pagamento) throw naoEncontrado('Pagamento não encontrado.');
  return pagamento;
}

/** RN10 — pagamento ativo (Pendente ou Pago) da reserva, se houver. */
export function pagamentoAtivoDaReserva(
  dados: DadosMock,
  reservaId: number,
): Pagamento | undefined {
  return dados.pagamentos.find(
    (p) =>
      p.reservaId === reservaId &&
      (p.status === StatusPagamento.Pendente || p.status === StatusPagamento.Pago),
  );
}

/** Modelo de leitura do cliente (sem a senha). */
export function semSenha({
  id,
  nome,
  cpf,
  email,
  telefone,
  dataNascimento,
  status,
}: ClienteMock): Cliente {
  return { id, nome, cpf, email, telefone, dataNascimento, status };
}
