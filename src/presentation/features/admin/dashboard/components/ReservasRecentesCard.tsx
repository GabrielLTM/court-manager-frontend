import { useId } from 'react';
import type { ReservaDetalhada } from '@/application/dto';
import { statusEfetivoDaReserva } from '@/domain/rules';
import { Card, DataTable, StatusTag, type Column } from '@/presentation/components/ui';
import { formatInicioReserva } from '@/presentation/features/admin/shared/format';
import styles from './DashboardCards.module.css';

export interface ReservasRecentesCardProps {
  reservas: readonly ReservaDetalhada[];
  agora: Date;
}

/** Últimas reservas criadas (Cliente, Quadra, Horário, Status). */
export function ReservasRecentesCard({ reservas, agora }: ReservasRecentesCardProps) {
  const tituloId = useId();

  const columns: Column<ReservaDetalhada>[] = [
    { key: 'cliente', header: 'Cliente', render: (r) => r.cliente?.nome ?? '—' },
    { key: 'quadra', header: 'Quadra', render: (r) => r.quadra?.nome ?? '—' },
    { key: 'horario', header: 'Horário', render: (r) => formatInicioReserva(r), className: styles.nowrap },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusTag kind="reserva" status={statusEfetivoDaReserva(r, agora)} />,
    },
  ];

  return (
    <Card as="section" padding="md" gap="lg" scrollX aria-labelledby={tituloId}>
      <h2 id={tituloId} className={styles.title}>
        Reservas recentes
      </h2>
      <DataTable
        columns={columns}
        rows={reservas}
        getRowKey={(r) => r.id}
        minWidth={420}
        emptyMessage="Nenhuma reserva registrada ainda."
      />
    </Card>
  );
}
