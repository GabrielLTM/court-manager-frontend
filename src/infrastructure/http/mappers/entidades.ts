import type {
  Cliente,
  Disponibilidade,
  Intervalo,
  Pagamento,
  Quadra,
  Reserva,
} from '@/domain/entities';
import { StatusReserva } from '@/domain/enums';
import { REGRAS_RESERVA } from '@/domain/rules';
import { ehRegistro, type Registro } from '@/infrastructure/shared/registro';
import { maskCpf, maskTelefone, onlyDigits } from '@/shared/lib/masks';
import { toMinutes } from '@/shared/lib/time';
import {
  lerMetodoPagamento,
  lerStatusCliente,
  lerStatusPagamento,
  lerStatusQuadra,
  lerStatusReserva,
} from './enums';
import {
  campo,
  exigir,
  exigirRegistro,
  idAninhado,
  lerData,
  lerDataHora,
  lerHora,
  lerLista,
  lerNumero,
  lerTexto,
} from './leitura';

/** Mapeadores JSON da API → entidades do domínio (ver dto.ts para o formato canônico). */

export function mapearQuadra(json: unknown): Quadra {
  const r = exigirRegistro(json, 'quadra');
  return {
    id: exigir(lerNumero(campo(r, 'id', 'quadraId')), 'quadra.id'),
    nome: lerTexto(campo(r, 'nome', 'name')) ?? '',
    tipo: lerTexto(campo(r, 'tipo', 'type')) ?? '',
    valorHora: exigir(lerNumero(campo(r, 'valorHora', 'precoHora', 'valor')), 'quadra.valorHora'),
    status: exigir(
      lerStatusQuadra(campo(r, 'status', 'statusQuadra', 'ativa', 'ativo')),
      'quadra.status',
    ),
  };
}

export function mapearCliente(json: unknown): Cliente {
  const r = exigirRegistro(json, 'cliente');
  const cpf = lerTexto(campo(r, 'cpf')) ?? '';
  const telefone = lerTexto(campo(r, 'telefone', 'celular', 'phone')) ?? '';
  return {
    id: exigir(lerNumero(campo(r, 'id', 'clienteId')), 'cliente.id'),
    nome: lerTexto(campo(r, 'nome', 'name')) ?? '',
    cpf: onlyDigits(cpf).length === 11 ? maskCpf(cpf) : cpf,
    email: lerTexto(campo(r, 'email')) ?? '',
    telefone: onlyDigits(telefone).length >= 10 ? maskTelefone(telefone) : telefone,
    dataNascimento: lerData(campo(r, 'dataNascimento', 'nascimento')),
    status: exigir(
      lerStatusCliente(campo(r, 'status', 'statusCliente', 'clienteAtivo', 'ativo')),
      'cliente.status',
    ),
  };
}

export function mapearReserva(json: unknown): Reserva {
  const r = exigirRegistro(json, 'reserva');
  return {
    id: exigir(lerNumero(campo(r, 'id', 'reservaId')), 'reserva.id'),
    clienteId: exigir(
      lerNumero(campo(r, 'clienteId')) ?? idAninhado(r, 'cliente'),
      'reserva.clienteId',
    ),
    quadraId: exigir(
      lerNumero(campo(r, 'quadraId')) ?? idAninhado(r, 'quadra'),
      'reserva.quadraId',
    ),
    data: exigir(lerData(campo(r, 'data', 'dataReserva')), 'reserva.data'),
    horaInicio: exigir(lerHora(campo(r, 'horaInicio', 'inicio')), 'reserva.horaInicio'),
    horaFim: exigir(lerHora(campo(r, 'horaFim', 'fim')), 'reserva.horaFim'),
    valor: lerNumero(campo(r, 'valor', 'valorTotal')) ?? 0,
    status: exigir(lerStatusReserva(campo(r, 'status', 'statusReserva')), 'reserva.status'),
    dataCriacao: lerDataHora(campo(r, 'dataCriacao', 'criadoEm', 'createdAt')) ?? '',
  };
}

export function mapearPagamento(json: unknown): Pagamento {
  const r = exigirRegistro(json, 'pagamento');
  return {
    id: exigir(lerNumero(campo(r, 'id', 'pagamentoId')), 'pagamento.id'),
    reservaId: exigir(
      lerNumero(campo(r, 'reservaId')) ?? idAninhado(r, 'reserva'),
      'pagamento.reservaId',
    ),
    valor: lerNumero(campo(r, 'valor')) ?? 0,
    metodo: exigir(
      lerMetodoPagamento(campo(r, 'metodo', 'metodoPagamento', 'formaPagamento')),
      'pagamento.metodo',
    ),
    status: exigir(lerStatusPagamento(campo(r, 'status', 'statusPagamento')), 'pagamento.status'),
    dataPagamento: lerDataHora(campo(r, 'dataPagamento', 'pagoEm')),
  };
}

/**
 * Formato canônico: `{ quadraId, data, abertura, fechamento, ocupados: [{ inicio, fim }] }`.
 * Também aceita uma lista de reservas/intervalos (`horaInicio`/`horaFim`), descartando as
 * canceladas (RN09) e as de outra quadra/data, caso o backend devolva a agenda completa.
 */
export function mapearDisponibilidade(
  json: unknown,
  consulta: { quadraId: number; data: string },
): Disponibilidade {
  const { r, itens } = separarDisponibilidade(json);
  const ocupados = itens
    .filter(ehRegistro)
    .filter((item) => pertenceAConsulta(item, consulta))
    .map(lerIntervalo)
    .filter((intervalo): intervalo is Intervalo => intervalo !== null)
    .sort((a, b) => toMinutes(a.inicio) - toMinutes(b.inicio));
  return {
    quadraId: (r && lerNumero(campo(r, 'quadraId'))) ?? consulta.quadraId,
    data: (r && lerData(campo(r, 'data'))) ?? consulta.data,
    abertura: (r && lerHora(campo(r, 'abertura', 'horaAbertura'))) ?? REGRAS_RESERVA.abertura,
    fechamento:
      (r && lerHora(campo(r, 'fechamento', 'horaFechamento'))) ?? REGRAS_RESERVA.fechamento,
    ocupados,
  };
}

/** Separa o objeto de disponibilidade (se houver) da lista de itens ocupados. */
function separarDisponibilidade(json: unknown): { r: Registro | null; itens: unknown[] } {
  if (!ehRegistro(json)) return { r: null, itens: lerLista(json, 'horários ocupados') };
  const ocupados = campo(json, 'ocupados', 'horariosOcupados', 'intervalos', 'reservas');
  if (ocupados !== undefined) return { r: json, itens: lerLista(ocupados, 'horários ocupados') };
  const envelope = campo(json, '$values', 'items', 'itens', 'value', 'results', 'data', 'dados');
  return Array.isArray(envelope) ? { r: null, itens: envelope } : { r: json, itens: [] };
}

function pertenceAConsulta(item: Registro, consulta: { quadraId: number; data: string }): boolean {
  const status = campo(item, 'status', 'statusReserva');
  if (status !== undefined && lerStatusReserva(status) === StatusReserva.Cancelada) return false;
  const quadraId = lerNumero(campo(item, 'quadraId'));
  const data = lerData(campo(item, 'data'));
  return (
    (quadraId === null || quadraId === consulta.quadraId) &&
    (data === null || data === consulta.data)
  );
}

function lerIntervalo(item: Registro): Intervalo | null {
  const inicio = lerHora(campo(item, 'inicio', 'horaInicio'));
  const fim = lerHora(campo(item, 'fim', 'horaFim'));
  return inicio && fim ? { inicio, fim } : null;
}
