import type { ClienteFiltro, PagamentoFiltro, ReservaFiltro } from '@/application/dto';
import type { Cliente, Pagamento, Reserva } from '@/domain/entities';
import { onlyDigits } from '@/shared/lib/masks';

/**
 * Filtros das listagens. O backend simulado usa-os como "consulta"; os repositórios HTTP os
 * reaplicam sobre a resposta, para funcionar mesmo que a API ainda ignore algum parâmetro.
 */

const semAcentos = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** Busca por nome, e-mail ou CPF (com ou sem máscara). */
export function clienteCorrespondeABusca(cliente: Cliente, busca: string): boolean {
  const termo = semAcentos(busca);
  if (!termo) return true;
  if (semAcentos(cliente.nome).includes(termo) || cliente.email.toLowerCase().includes(termo)) return true;
  const digitos = onlyDigits(busca);
  return digitos.length > 0 && onlyDigits(cliente.cpf).includes(digitos);
}

export function filtrarClientes(clientes: readonly Cliente[], filtro: ClienteFiltro = {}): Cliente[] {
  return clientes.filter(
    (c) =>
      (filtro.status === undefined || c.status === filtro.status) &&
      (!filtro.busca || clienteCorrespondeABusca(c, filtro.busca)),
  );
}

export function filtrarReservas(reservas: readonly Reserva[], filtro: ReservaFiltro = {}): Reserva[] {
  return reservas.filter(
    (r) =>
      (filtro.clienteId === undefined || r.clienteId === filtro.clienteId) &&
      (filtro.quadraId === undefined || r.quadraId === filtro.quadraId) &&
      (!filtro.data || r.data === filtro.data) &&
      (filtro.status === undefined || r.status === filtro.status),
  );
}

/**
 * O filtro por cliente depende das reservas (o pagamento só conhece `reservaId`); sem o índice de
 * reservas, esse critério fica a cargo do backend.
 */
export function filtrarPagamentos(
  pagamentos: readonly Pagamento[],
  filtro: PagamentoFiltro = {},
  reservasPorId?: ReadonlyMap<number, Reserva>,
): Pagamento[] {
  const filtrarPorCliente = filtro.clienteId !== undefined && reservasPorId !== undefined;
  return pagamentos.filter(
    (p) =>
      (filtro.status === undefined || p.status === filtro.status) &&
      (filtro.reservaId === undefined || p.reservaId === filtro.reservaId) &&
      (!filtrarPorCliente || reservasPorId.get(p.reservaId)?.clienteId === filtro.clienteId),
  );
}
