import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'aside' | 'article';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  /** sm = space-3 (padrão .card), md = space-4, lg = space-6 */
  padding?: 'sm' | 'md' | 'lg';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  /** Permite rolagem horizontal (tabelas largas). */
  scrollX?: boolean;
}

export function Card({
  as: Tag = 'div',
  elevation = 'none',
  padding = 'sm',
  gap,
  scrollX = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={clsx(
        'card',
        elevation !== 'none' && `elev-${elevation}`,
        styles[`p-${padding}`],
        gap && styles[`g-${gap}`],
        scrollX && styles.scroll,
        className,
      )}
      {...rest}
    />
  );
}

export function CardKicker({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx('card-kicker', className)} {...rest} />;
}
