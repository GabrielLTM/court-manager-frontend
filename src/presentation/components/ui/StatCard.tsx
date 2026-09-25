import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Card, CardKicker } from './Card';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** md = cards do cliente (28px), lg = dashboard (34px, elevado) */
  size?: 'md' | 'lg';
}

export function StatCard({ label, value, hint, size = 'md' }: StatCardProps) {
  return (
    <Card elevation={size === 'lg' ? 'sm' : 'none'} padding={size === 'lg' ? 'md' : 'sm'} gap="xs">
      <CardKicker>{label}</CardKicker>
      <span className={clsx(styles.value, size === 'lg' && styles.lg)}>{value}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </Card>
  );
}
