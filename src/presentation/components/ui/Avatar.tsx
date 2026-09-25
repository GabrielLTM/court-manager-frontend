import clsx from 'clsx';
import { iniciais } from '@/shared/lib/format';
import styles from './Avatar.module.css';

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span className={clsx(styles.avatar, className)} aria-hidden>
      {iniciais(nome)}
    </span>
  );
}
