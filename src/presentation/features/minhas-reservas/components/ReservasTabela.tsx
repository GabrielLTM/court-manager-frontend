import type { ReservaDetalhada } from '@/application/dto';
import type { Pagamento } from '@/domain/entities';
import { METODO_PAGAMENTO_LABEL, Perfil } from '@/domain/enums';
import { podeCancelarReserva, statusEfetivoDaReserva } from '@/domain/rules';
import { Button, DataTable, StatusTag, type Column } from '@/presentation/components/ui';
import { formatDataCurta } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { formatHorario, podePagar } from '../minhasReservas.utils';
import styles from './ReservasTabela.module.css';

export interface ReservasTabelaProps {
  /** Já ordenadas (próximas primeiro). */
  reservas: readonly ReservaDetalhada[];
  agora: Date;
  onCancelar: (reserva: ReservaDetalhada) => void;
  onPagar: (reserva: ReservaDetalhada) => void;
}

function SituacaoPagamento({ pagamento }: { pagamento: Pagamento | null }) {
  return (
    <span className={styles.pagamento}>
      <StatusTag kind="pagamento" status={pagamento?.status} />
      {pagamento && <span className={styles.metodo}>{METODO_PAGAMENTO_LABEL[pagamento.metodo]}</span>}
    </span>
  );
}

/** Tabela de reservas do cliente com as ações Pagar (RF14) e Cancelar (RF12 / RN08). */
export function ReservasTabela({ reservas, agora, onCancelar, onPagar }: ReservasTabelaProps) {
  const colunas: Column<ReservaDetalhada>[] = [
    { key: 'data', header: 'Data', render: (r) => formatDataCurta(r.data), className: styles.data },
    { key: 'quadra', header: 'Quadra', render: (r) => r.quadra?.nome ?? '—' },
    { key: 'horario', header: 'Horário', render: formatHorario },
    { key: 'valor', header: 'Valor', render: (r) => formatBRL(r.valor) },
    {
      key: 'reserva',
      header: 'Reserva',
      render: (r) => <StatusTag kind="reserva" status={statusEfetivoDaReserva(r, agora)} />,
    },
    { key: 'pagamento', header: 'Pagamento', render: (r) => <SituacaoPagamento pagamento={r.pagamento} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (r) => {
        const codigo = formatCodigoReserva(r.id);
        return (
          <div className={styles.acoes}>
            {podePagar(r) && (
              <Button variant="ghost" aria-label={`Pagar reserva ${codigo}`} onClick={() => onPagar(r)}>
                Pagar
              </Button>
            )}
            {podeCancelarReserva(r, agora, Perfil.Cliente).permitido && (
              <Button variant="ghost" aria-label={`Cancelar reserva ${codigo}`} onClick={() => onCancelar(r)}>
                Cancelar
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.tabela}>
      <DataTable columns={colunas} rows={reservas} getRowKey={(r) => r.id} minWidth={640} caption="Minhas reservas" />
    </div>
  );
}
