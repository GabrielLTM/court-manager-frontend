import type { QuadraInput } from '@/application/dto';
import type { Quadra } from '@/domain/entities';
import { StatusQuadra } from '@/domain/enums';
import type { QuadraFormValues } from '@/presentation/validation/schemas';
import { parseDecimal } from '@/shared/lib/format';

/** Sugestões do campo "Tipo" (datalist). */
export const TIPOS_QUADRA = ['Beach Tennis', 'Futevôlei', 'Vôlei de praia'] as const;

/** Ações de status do cartão da quadra (RF07), na ordem do protótipo. */
export const ACOES_STATUS_QUADRA: ReadonlyArray<{ status: StatusQuadra; rotulo: string }> = [
  { status: StatusQuadra.Ativa, rotulo: 'Ativar' },
  { status: StatusQuadra.Manutencao, rotulo: 'Manutenção' },
  { status: StatusQuadra.Inativa, rotulo: 'Inativar' },
];

const SUFIXO_STATUS: Record<StatusQuadra, string> = {
  [StatusQuadra.Ativa]: 'ativada',
  [StatusQuadra.Manutencao]: 'em manutenção',
  [StatusQuadra.Inativa]: 'inativada',
};

/** "Quadra 02 — em manutenção" / "Quadra 01 — ativada" / "Quadra 06 — inativada". */
export function mensagemStatusQuadra(nome: string, status: StatusQuadra): string {
  return `${nome} — ${SUFIXO_STATUS[status]}`;
}

/** 80 -> "80,00" (valor exibido no campo de texto do formulário). */
export function formatValorHoraInput(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

const statusParaForm = (status: StatusQuadra) => String(status) as QuadraFormValues['status'];

/** Valores iniciais do formulário (vazio e "Ativa" para uma nova quadra). */
export function quadraParaForm(quadra: Quadra | null | undefined): QuadraFormValues {
  if (!quadra) return { nome: '', tipo: '', valorHora: '', status: statusParaForm(StatusQuadra.Ativa) };
  return {
    nome: quadra.nome,
    tipo: quadra.tipo,
    valorHora: formatValorHoraInput(quadra.valorHora),
    status: statusParaForm(quadra.status),
  };
}

/** Converte os valores do formulário (strings) no DTO da API (RF05/RF06). */
export function formParaQuadraInput(values: QuadraFormValues): QuadraInput {
  return {
    nome: values.nome.trim(),
    tipo: values.tipo.trim(),
    valorHora: parseDecimal(values.valorHora),
    status: Number(values.status) as StatusQuadra,
  };
}

/** Próxima identificação sugerida: "Quadra 01".."Quadra 06" -> "Quadra 07". */
export function sugerirNomeQuadra(quadras: readonly Pick<Quadra, 'nome'>[]): string {
  const numeros = quadras
    .map((q) => /(\d+)\s*$/.exec(q.nome)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  const proximo = (numeros.length > 0 ? Math.max(...numeros) : quadras.length) + 1;
  return `Quadra ${String(proximo).padStart(2, '0')}`;
}
