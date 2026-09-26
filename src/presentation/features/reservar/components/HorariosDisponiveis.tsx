import type { UseQueryResult } from '@tanstack/react-query';
import type { Disponibilidade, Quadra, Slot } from '@/domain/entities';
import { SlotGrid, SlotLegend } from '@/presentation/components/SlotGrid/SlotGrid';
import { EmptyState, ErrorState, LoadingState } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';

export interface HorariosDisponiveisProps {
  quadra: Quadra | null;
  /** Consulta GET /api/quadras/{id}/disponibilidade. */
  consulta: Pick<UseQueryResult<Disponibilidade>, 'isError' | 'error' | 'refetch'>;
  /** `gerarSlots(...)` sobre a disponibilidade carregada (null enquanto não houver dados). */
  slots: readonly Slot[] | null;
  selecionado: string | null;
  onSelecionar: (hora: string) => void;
  onIndisponivel: (slot: Slot) => void;
}

/** Passo "4. Horários disponíveis": grade de horários + legenda, com carregando/erro. */
export function HorariosDisponiveis({
  quadra,
  consulta,
  slots,
  selecionado,
  onSelecionar,
  onIndisponivel,
}: HorariosDisponiveisProps) {
  if (!quadra) {
    return (
      <EmptyState
        title="Nenhuma quadra disponível"
        description="No momento não há quadras ativas para reserva."
      />
    );
  }

  if (!slots) {
    return consulta.isError ? (
      <ErrorState message={getErrorMessage(consulta.error)} onRetry={() => void consulta.refetch()} />
    ) : (
      <LoadingState label="Consultando horários…" />
    );
  }

  return (
    <>
      <SlotGrid slots={slots} selecionado={selecionado} onSelecionar={onSelecionar} onIndisponivel={onIndisponivel} />
      <SlotLegend />
    </>
  );
}
