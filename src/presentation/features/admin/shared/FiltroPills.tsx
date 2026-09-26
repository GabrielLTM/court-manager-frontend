import { Pill } from '@/presentation/components/ui';
import styles from './FiltroPills.module.css';

export interface FiltroOpcao<T extends string> {
  value: T;
  label: string;
}

export interface FiltroPillsProps<T extends string> {
  options: ReadonlyArray<FiltroOpcao<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Grupo de pílulas de filtro (Todos / Ativos / Inativos...), no estilo "plain" do protótipo. */
export function FiltroPills<T extends string>({ options, value, onChange, ariaLabel }: FiltroPillsProps<T>) {
  return (
    <div className={styles.pills} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <Pill
          key={option.value}
          size="sm"
          tone="plain"
          active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Pill>
      ))}
    </div>
  );
}
