import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';
import { Tag } from './Tag';

export interface PageHeaderProps {
  title: ReactNode;
  /** Rota exibida na tag monoespaçada (ex.: "/reservar"). */
  route?: string;
  actions?: ReactNode;
}

/** Título da página + tag da rota, como no protótipo. */
export function PageHeader({ title, route, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {route && (
        <Tag tone="neutral" className={styles.route}>
          {route}
        </Tag>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
