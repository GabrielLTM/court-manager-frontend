import type { ComponentProps } from 'react';
import { pillClassName, type PillStyleOptions } from './pillClassName';

export interface PillProps extends Omit<ComponentProps<'button'>, 'className'>, PillStyleOptions {}

/** Botão-pílula selecionável (aria-pressed reflete `active`). */
export function Pill({ active = false, tone, size, className, type = 'button', ...rest }: PillProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={pillClassName({ active, tone, size, className })}
      {...rest}
    />
  );
}
