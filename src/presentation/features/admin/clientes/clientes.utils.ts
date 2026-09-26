import type { AtualizarClienteInput, NovoClienteInput } from '@/application/dto';
import type { Cliente, Reserva } from '@/domain/entities';
import { StatusCliente } from '@/domain/enums';
import type { FiltroOpcao } from '@/presentation/features/admin/shared/FiltroPills';
import { normalizarBusca } from '@/presentation/features/admin/shared/format';
import type { ClienteFormValues } from '@/presentation/validation/schemas';
import { onlyDigits } from '@/shared/lib/masks';

export type FiltroStatusCliente = 'todos' | 'ativos' | 'inativos';

export const FILTROS_STATUS_CLIENTE: ReadonlyArray<FiltroOpcao<FiltroStatusCliente>> = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
];

const STATUS_DO_FILTRO: Record<Exclude<FiltroStatusCliente, 'todos'>, StatusCliente> = {
  ativos: StatusCliente.Ativo,
  inativos: StatusCliente.Inativo,
};

/**
 * Busca por nome, CPF ou e-mail, sem diferenciar acentos/maiúsculas. Termos numéricos
 * ("012.345", "01234") são comparados com os dígitos do CPF; cada palavra do termo deve
 * aparecer no nome ou no e-mail ("isa oli" encontra "Isadora Oliveira").
 */
export function clienteCorrespondeBusca(cliente: Pick<Cliente, 'nome' | 'cpf' | 'email'>, busca: string): boolean {
  const termo = normalizarBusca(busca);
  if (!termo) return true;
  if (/^[\d.\-\s/]+$/.test(termo)) {
    const digitos = onlyDigits(termo);
    if (digitos && onlyDigits(cliente.cpf).includes(digitos)) return true;
  }
  const alvo = normalizarBusca(`${cliente.nome} ${cliente.email}`);
  return termo.split(/\s+/).every((palavra) => alvo.includes(palavra));
}

export function filtrarClientes<T extends Pick<Cliente, 'nome' | 'cpf' | 'email' | 'status'>>(
  clientes: readonly T[],
  filtro: { busca: string; status: FiltroStatusCliente },
): T[] {
  return clientes.filter(
    (cliente) =>
      (filtro.status === 'todos' || cliente.status === STATUS_DO_FILTRO[filtro.status]) &&
      clienteCorrespondeBusca(cliente, filtro.busca),
  );
}

/** Quantidade de reservas (histórico completo) por cliente. */
export function contarReservasPorCliente(reservas: readonly Pick<Reserva, 'clienteId'>[]): Map<number, number> {
  const contagem = new Map<number, number>();
  for (const { clienteId } of reservas) contagem.set(clienteId, (contagem.get(clienteId) ?? 0) + 1);
  return contagem;
}

/** Toast após inativar/reativar (RF04) — neutro quanto ao gênero. */
export function mensagemStatusCliente(nome: string, status: StatusCliente): string {
  return `${nome} — cadastro ${status === StatusCliente.Ativo ? 'reativado' : 'inativado'}`;
}

/** Valores iniciais do formulário (vazio e "Ativo" para um novo cliente). */
export function clienteParaForm(cliente: Cliente | null | undefined): ClienteFormValues {
  return {
    nome: cliente?.nome ?? '',
    cpf: cliente?.cpf ?? '',
    dataNascimento: cliente?.dataNascimento ?? '',
    telefone: cliente?.telefone ?? '',
    email: cliente?.email ?? '',
    senha: '',
    status: String(cliente?.status ?? StatusCliente.Ativo) as ClienteFormValues['status'],
  };
}

function dadosComuns(values: ClienteFormValues) {
  return {
    nome: values.nome.trim(),
    cpf: values.cpf.trim(),
    telefone: values.telefone.trim(),
    email: values.email.trim(),
    dataNascimento: values.dataNascimento || null,
    status: Number(values.status) as StatusCliente,
  };
}

/** POST /api/clientes (RF01). */
export function formParaNovoCliente(values: ClienteFormValues): NovoClienteInput {
  return { ...dadosComuns(values), senha: values.senha };
}

/** PUT /api/clientes/{id} (RF02) — senha vazia é omitida para manter a atual. */
export function formParaAtualizarCliente(values: ClienteFormValues): AtualizarClienteInput {
  const input: AtualizarClienteInput = dadosComuns(values);
  return values.senha ? { ...input, senha: values.senha } : input;
}
