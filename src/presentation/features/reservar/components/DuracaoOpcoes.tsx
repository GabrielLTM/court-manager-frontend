import { REGRAS_RESERVA } from '@/domain/rules';
import { Pill } from '@/presentation/components/ui';
import { formatDuracaoLonga } from '@/shared/lib/format';
import styles from './DuracaoOpcoes.module.css';

export interface DuracaoOpcoesProps {
  value: number;
  onChange: (duracaoMinutos: number) => void;
}

/** Passo "3. Duração": 1 hora / 1h30 / 2 horas. */
export function DuracaoOpcoes({ value, onChange }: DuracaoOpcoesProps) {
  return (
    <div className={styles.opcoes} role="group" aria-label="Duração">
      {REGRAS_RESERVA.duracoesMinutos.map((minutos) => (
        <Pill key={minutos} active={minutos === value} onClick={() => onChange(minutos)}>
          {formatDuracaoLonga(minutos)}
        </Pill>
      ))}
    </div>
  );
}
