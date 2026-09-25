import styles from './ProgressBar.module.css';

/** Barra de ocupação (0–100). Mantém 2% mínimos visíveis, como no protótipo. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div className={styles.bar} style={{ width: `${Math.max(clamped, 2)}%` }} />
    </div>
  );
}
