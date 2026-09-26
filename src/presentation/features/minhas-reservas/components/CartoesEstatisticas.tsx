import { StatCard } from '@/presentation/components/ui';
import { formatHorasJogadas, type EstatisticasCliente } from '../minhasReservas.utils';
import styles from './CartoesEstatisticas.module.css';

/** Indicadores do cliente: próximas reservas, pagamentos pendentes e horas jogadas no mês. */
export function CartoesEstatisticas({ estatisticas }: { estatisticas: EstatisticasCliente }) {
  return (
    <div className={styles.grid}>
      <StatCard label="Próximas reservas" value={estatisticas.proximasReservas} />
      <StatCard label="Pagamentos pendentes" value={estatisticas.pagamentosPendentes} />
      <StatCard label="Horas jogadas no mês" value={formatHorasJogadas(estatisticas.minutosJogadosNoMes)} />
    </div>
  );
}
