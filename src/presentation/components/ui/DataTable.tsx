import clsx from 'clsx';
import type { Key, ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  getRowKey: (row: T) => Key;
  emptyMessage?: ReactNode;
  /** Largura mínima (px) antes de rolar horizontalmente — como no protótipo. */
  minWidth?: number;
  caption?: string;
}

/** Tabela (.table) com rolagem horizontal em telas estreitas. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = 'Nenhum registro encontrado.',
  minWidth,
  caption,
}: DataTableProps<T>) {
  return (
    <div className={styles.scroll}>
      <table className="table" style={minWidth ? { minWidth } : undefined}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={clsx(column.align && styles[column.align])}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} className={clsx(column.align && styles[column.align], column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
