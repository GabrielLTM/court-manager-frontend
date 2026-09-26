import { useId } from 'react';
import type { OcupacaoQuadra } from '@/application/dto';
import { Card, ProgressBar } from '@/presentation/components/ui';
import { formatPercentual } from '@/shared/lib/format';
import styles from './DashboardCards.module.css';

/** Percentual de ocupação de cada quadra no dia. */
export function OcupacaoCard({ ocupacao }: { ocupacao: readonly OcupacaoQuadra[] }) {
  const tituloId = useId();

  return (
    <Card as="section" padding="md" gap="lg" aria-labelledby={tituloId}>
      <h2 id={tituloId} className={styles.title}>
        Ocupação por quadra — hoje
      </h2>
      {ocupacao.length === 0 ? (
        <p className={styles.empty}>Nenhuma quadra cadastrada.</p>
      ) : (
        <ul className={styles.list}>
          {ocupacao.map((item) => (
            <li key={item.quadra.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span>{item.quadra.nome}</span>
                <span className={styles.percent}>{formatPercentual(item.percentual)}</span>
              </div>
              <ProgressBar value={item.percentual} label={`Ocupação da ${item.quadra.nome}`} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
