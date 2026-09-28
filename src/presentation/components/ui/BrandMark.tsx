import clsx from 'clsx';
import simboloOttawa from '@/presentation/assets/ottawa-tech-simbolo.jpg';
import styles from './BrandMark.module.css';

export interface BrandMarkProps {
  size?: 'md' | 'lg';
  /** Linha "by Ottawa Tech" abaixo do nome (padrão: apenas no tamanho lg, como no design). */
  assinatura?: boolean;
  className?: string;
}

/** Símbolo da Ottawa Tech + nome da arena. */
export function BrandMark({ size = 'md', assinatura = size === 'lg', className }: BrandMarkProps) {
  return (
    <div className={clsx(styles.brand, size === 'lg' && styles.lg, className)}>
      <img className={styles.logo} src={simboloOttawa} alt="" aria-hidden width={52} height={52} />
      <span className={styles.text}>
        <span className={styles.name}>Arena Beach Tennis</span>
        {assinatura && <span className={styles.subtitle}>by Ottawa Tech</span>}
      </span>
    </div>
  );
}
