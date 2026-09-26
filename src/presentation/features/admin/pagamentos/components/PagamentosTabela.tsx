import clsx from 'clsx';
import type { PagamentoDetalhado } from '@/application/dto';
import { METODO_PAGAMENTO_LABEL } from '@/domain/enums';
import { pagamentoPodeSerConfirmado } from '@/domain/rules';
import { Button, DataTable, StatusTag, type Column } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useConfirmarPagamento } from '@/presentation/queries';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import styles from './PagamentosTabela.module.css';

export interface PagamentosTabelaProps {
  pagamentos: readonly PagamentoDetalhado[];
  onRecibo: (pagamento: PagamentoDetalhado) => void;
  emptyMessage: string;
}

/** Pagamentos registrados, com confirmação de recebimento (RF16) e recibo. */
export function PagamentosTabela({ pagamentos, onRecibo, emptyMessage }: PagamentosTabelaProps) {
  const toast = useToast();
  const confirmar = useConfirmarPagamento();

  const confirmarPagamento = async (pagamento: PagamentoDetalhado) => {
    try {
      await confirmar.mutateAsync(pagamento.id);
      toast.success(`Pagamento ${formatCodigoReserva(pagamento.reservaId)} confirmado`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const columns: Column<PagamentoDetalhado>[] = [
    { key: 'reserva', header: 'Reserva', render: (p) => formatCodigoReserva(p.reservaId), className: styles.codigo },
    { key: 'cliente', header: 'Cliente', render: (p) => p.cliente?.nome ?? '—' },
    { key: 'quadra', header: 'Quadra', render: (p) => p.quadra?.nome ?? '—' },
    { key: 'valor', header: 'Valor', render: (p) => formatBRL(p.valor), className: styles.valor },
    { key: 'metodo', header: 'Método', render: (p) => METODO_PAGAMENTO_LABEL[p.metodo] },
    { key: 'status', header: 'Status', render: (p) => <StatusTag kind="pagamento" status={p.status} /> },
    {
      key: 'acao',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (p) => {
        const codigo = formatCodigoReserva(p.reservaId);
        if (pagamentoPodeSerConfirmado(p)) {
          return (
            <Button
              variant="primary"
              className={styles.acao}
              loading={confirmar.isPending && confirmar.variables === p.id}
              onClick={() => void confirmarPagamento(p)}
              aria-label={`Confirmar pagamento ${codigo}`}
            >
              Confirmar
            </Button>
          );
        }
        return (
          <Button
            variant="secondary"
            className={clsx(styles.acao, styles.recibo)}
            onClick={() => onRecibo(p)}
            aria-label={`Recibo ${codigo}`}
          >
            Recibo
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={pagamentos}
      getRowKey={(p) => p.id}
      minWidth={720}
      caption="Pagamentos"
      emptyMessage={emptyMessage}
    />
  );
}
