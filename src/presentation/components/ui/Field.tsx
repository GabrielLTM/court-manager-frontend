import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Rótulo + controle + mensagem de erro/ajuda (.field do design system). */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={clsx('field', styles.field, className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className={clsx(styles.message, styles.error)} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={clsx(styles.message, styles.hint)}>{hint}</p>
      ) : null}
    </div>
  );
}
