import { useId, type ReactNode } from 'react';
import styles from './Etapa.module.css';

export interface EtapaProps {
  /** Ex.: "1. Data" */
  titulo: string;
  /** Texto auxiliar na mesma linha de base do título (ex.: "Selecionada: 20/09/2026"). */
  complemento?: ReactNode;
  children: ReactNode;
}

/** Passo numerado do formulário de reserva. */
export function Etapa({ titulo, complemento, children }: EtapaProps) {
  const tituloId = useId();
  return (
    <section className={styles.etapa} aria-labelledby={tituloId}>
      <div className={styles.cabecalho}>
        <h2 id={tituloId} className={styles.titulo}>
          {titulo}
        </h2>
        {complemento && <span className={styles.complemento}>{complemento}</span>}
      </div>
      {children}
    </section>
  );
}
