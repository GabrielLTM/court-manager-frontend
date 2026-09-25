import clsx from 'clsx';
import styles from './BrandMark.module.css';

/** Logotipo "A" + nome da arena. */
export function BrandMark({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <div className={clsx(styles.brand, size === 'lg' && styles.lg, className)}>
      <span className={styles.logo} aria-hidden>
        A
      </span>
      <span className={styles.name}>Arena Beach Tennis</span>
    </div>
  );
}
