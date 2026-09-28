import clsx from 'clsx';
import { useId } from 'react';
import type { Quadra } from '@/domain/entities';
import { Button, Card, CardKicker, DetailList } from '@/presentation/components/ui';
import { linhasResumo, totalDaReserva } from '../reservar.utils';
import styles from './ResumoReserva.module.css';

export interface ResumoReservaProps {
  quadra: Quadra | null;
  data: string;
  /** Horário de início válido (ou null quando nenhum horário livre foi escolhido). */
  horaInicio: string | null;
  duracaoMinutos: number;
  onConfirmar: () => void;
}

/** Card lateral fixo com o resumo e o total da reserva (RN07). */
export function ResumoReserva({ quadra, data, horaInicio, duracaoMinutos, onConfirmar }: ResumoReservaProps) {
  const tituloId = useId();
  const podeConfirmar = quadra !== null && horaInicio !== null;

  return (
    <Card as="aside" elevation="md" padding="lg" gap="lg" className={styles.resumo} aria-labelledby={tituloId}>
      <CardKicker id={tituloId}>Resumo da reserva</CardKicker>
      <h3 className={styles.quadra}>{quadra?.nome ?? '—'}</h3>
      <DetailList items={linhasResumo({ quadra, data, horaInicio, duracaoMinutos })} />
      <hr className={clsx('hr', styles.divisor)} />
      <div className={styles.total}>
        <span className={styles.totalRotulo}>Total</span>
        <span className={styles.totalValor}>{totalDaReserva(quadra, duracaoMinutos)}</span>
      </div>
      <Button variant="primary" size="xl" block disabled={!podeConfirmar} onClick={onConfirmar}>
        {podeConfirmar ? 'Confirmar reserva' : 'Selecione um horário'}
      </Button>
      <p className={styles.nota}>O horário fica garantido assim que a reserva é confirmada.</p>
    </Card>
  );
}
