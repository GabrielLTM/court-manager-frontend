import clsx from 'clsx';
import type { ComponentProps } from 'react';
import styles from './Input.module.css';

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean;
}

/** Campo de texto (.input). Compatível com `register()` do react-hook-form (ref como prop — React 19). */
export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      className={clsx('input', invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export interface SelectProps extends ComponentProps<'select'> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={clsx('input', styles.select, invalid && styles.invalid, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
