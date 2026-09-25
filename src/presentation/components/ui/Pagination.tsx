import { Pill } from './Pill';
import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export function Pagination({ page, pageCount, onPageChange, totalItems }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <Pill size="sm" tone="plain" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ‹ Anterior
      </Pill>
      <span className={styles.info}>
        Página {page} de {pageCount}
        {totalItems !== undefined && ` · ${totalItems} registros`}
      </span>
      <Pill size="sm" tone="plain" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Próxima ›
      </Pill>
    </nav>
  );
}
