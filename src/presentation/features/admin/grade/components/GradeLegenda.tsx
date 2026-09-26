import clsx from 'clsx';
import styles from './GradeLegenda.module.css';

const ITENS = [
  { chave: 'livre', rotulo: 'Livre' },
  { chave: 'pago', rotulo: 'Pago' },
  { chave: 'pendente', rotulo: 'Pagamento pendente' },
  { chave: 'indisponivel', rotulo: 'Indisponível' },
] as const;

/** Legenda das cores da grade de reservas. */
export function GradeLegenda() {
  return (
    <ul className={styles.legenda} aria-label="Legenda da grade">
      {ITENS.map((item) => (
        <li key={item.chave} className={styles.item}>
          <span className={clsx(styles.amostra, styles[item.chave])} aria-hidden />
          {item.rotulo}
        </li>
      ))}
    </ul>
  );
}
