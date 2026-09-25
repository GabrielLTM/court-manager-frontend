import clsx from 'clsx';
import type { Slot } from '@/domain/entities';
import { MOTIVO_INDISPONIBILIDADE_LABEL } from '@/domain/rules';
import styles from './SlotGrid.module.css';

export interface SlotGridProps {
  /** Resultado de `gerarSlots(...)` (domínio). */
  slots: readonly Slot[];
  selecionado: string | null;
  onSelecionar: (hora: string) => void;
  /** Clique em horário indisponível (ex.: exibir toast com o motivo). */
  onIndisponivel?: (slot: Slot) => void;
  ariaLabel?: string;
}

/** Grade de horários de início (passo "4. Horários disponíveis"). */
export function SlotGrid({
  slots,
  selecionado,
  onSelecionar,
  onIndisponivel,
  ariaLabel = 'Horários disponíveis',
}: SlotGridProps) {
  return (
    <div className={styles.grid} role="group" aria-label={ariaLabel}>
      {slots.map((slot) => {
        const selected = slot.disponivel && slot.hora === selecionado;
        return (
          <button
            key={slot.hora}
            type="button"
            className={clsx(styles.slot, selected && styles.selected, !slot.disponivel && styles.busy)}
            aria-pressed={selected}
            aria-disabled={!slot.disponivel || undefined}
            title={
              !slot.disponivel && slot.motivo
                ? MOTIVO_INDISPONIBILIDADE_LABEL[slot.motivo]
                : `${slot.hora}–${slot.fim}`
            }
            onClick={() => (slot.disponivel ? onSelecionar(slot.hora) : onIndisponivel?.(slot))}
          >
            {slot.hora}
          </button>
        );
      })}
    </div>
  );
}

/** Legenda Livre / Selecionado / Ocupado. */
export function SlotLegend() {
  return (
    <div className={styles.legend}>
      <span className={styles.legendItem}>
        <span className={clsx(styles.dot, styles.dotFree)} />
        Livre
      </span>
      <span className={styles.legendItem}>
        <span className={clsx(styles.dot, styles.dotSelected)} />
        Selecionado
      </span>
      <span className={styles.legendItem}>
        <span className={clsx(styles.dot, styles.dotBusy)} />
        Ocupado
      </span>
    </div>
  );
}
