import clsx from 'clsx';
import type { ComponentProps } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'plain';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  /** md = 36px (padrão do design system), lg = 44px, xl = 48px */
  size?: 'md' | 'lg' | 'xl';
  block?: boolean;
  loading?: boolean;
}

/** Botão do design system (.btn): tipografia Caprasimo, formato pílula. */
export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'btn',
        variant !== 'plain' && `btn-${variant}`,
        block && 'btn-block',
        size !== 'md' && styles[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      {children}
    </button>
  );
}
