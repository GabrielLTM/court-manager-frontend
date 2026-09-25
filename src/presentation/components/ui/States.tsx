import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './States.module.css';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.inline}>
        <span className={styles.spinner} aria-hidden />
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <span className={styles.title}>{title}</span>
      {description && <span>{description}</span>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: ReactNode; onRetry?: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <span className={styles.title}>Algo deu errado</span>
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
