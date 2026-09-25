import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './DetailList.module.css';

export interface DetailItem {
  label: ReactNode;
  value: ReactNode;
}

/** Linhas chave/valor (resumo da reserva, diálogos de confirmação). */
export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={clsx(styles.list, className)}>
      {items.map((item, index) => (
        <div key={index} className={styles.row}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
