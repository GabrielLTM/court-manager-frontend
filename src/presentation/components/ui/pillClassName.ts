import clsx from 'clsx';
import styles from './Pill.module.css';

export interface PillStyleOptions {
  active?: boolean;
  tone?: 'surface' | 'plain';
  /** lg = 44px (padrão), md = 38px, sm = 36px */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Classes da pílula — use também em links (NavLink) que devem parecer pílulas. */
export function pillClassName({ active = false, tone = 'surface', size = 'lg', className }: PillStyleOptions = {}) {
  return clsx(styles.pill, size !== 'lg' && styles[size], tone === 'plain' && styles.plain, active && styles.active, className);
}
