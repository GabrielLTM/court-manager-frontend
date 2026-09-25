import type { Quadra } from '@/domain/entities';
import { StatusQuadra } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';

/** RN03 — somente quadras ativas podem receber novas reservas. */
export function quadraPodeSerReservada(quadra: Pick<Quadra, 'status'>): boolean {
  return quadra.status === StatusQuadra.Ativa;
}

/** Descrição curta do motivo de indisponibilidade ("em manutenção" | "inativa") ou null. */
export function motivoQuadraIndisponivel(quadra: Pick<Quadra, 'status'>): string | null {
  if (quadra.status === StatusQuadra.Manutencao) return 'em manutenção';
  if (quadra.status === StatusQuadra.Inativa) return 'inativa';
  return null;
}

/** Mensagem padrão exibida ao tentar reservar uma quadra indisponível. */
export function mensagemQuadraIndisponivel(quadra: Pick<Quadra, 'status' | 'nome'>): string {
  return `RN03 — ${quadra.nome} ${motivoQuadraIndisponivel(quadra) ?? 'indisponível'} não pode ser reservada.`;
}

export function validarDadosQuadra(dados: Pick<Quadra, 'nome' | 'tipo' | 'valorHora'>): void {
  if (!dados.nome.trim()) throw new DomainError('VALIDACAO', 'Informe a identificação da quadra.');
  if (!dados.tipo.trim()) throw new DomainError('VALIDACAO', 'Informe o tipo da quadra.');
  if (!Number.isFinite(dados.valorHora) || dados.valorHora <= 0) {
    throw new DomainError('VALIDACAO', 'O valor por hora deve ser maior que zero.');
  }
}
