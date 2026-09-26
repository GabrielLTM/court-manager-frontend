import type { PagamentoDetalhado } from '@/application/dto';
import { METODO_PAGAMENTO_LABEL } from '@/domain/enums';
import { Button, DetailList, Dialog, StatusTag, type DetailItem } from '@/presentation/components/ui';
import { formatPeriodoReservaCompleto } from '@/presentation/features/admin/shared/format';
import { formatDataHora } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';

export interface ReciboDialogProps {
  pagamento: PagamentoDetalhado;
  onClose: () => void;
}

/** Recibo do pagamento de uma reserva. */
export function ReciboDialog({ pagamento, onClose }: ReciboDialogProps) {
  const codigo = formatCodigoReserva(pagamento.reservaId);
  const itens: DetailItem[] = [
    { label: 'Reserva', value: codigo },
    { label: 'Cliente', value: pagamento.cliente?.nome ?? '—' },
    { label: 'Quadra', value: pagamento.quadra?.nome ?? '—' },
    {
      label: 'Data/horário',
      value: pagamento.reserva ? formatPeriodoReservaCompleto(pagamento.reserva) : '—',
    },
    { label: 'Método', value: METODO_PAGAMENTO_LABEL[pagamento.metodo] },
    { label: 'Status', value: <StatusTag kind="pagamento" status={pagamento.status} /> },
    { label: 'Valor', value: formatBRL(pagamento.valor) },
  ];
  if (pagamento.dataPagamento) itens.push({ label: 'Pago em', value: formatDataHora(pagamento.dataPagamento) });

  return (
    <Dialog
      open
      title={`Recibo ${codigo}`}
      onClose={onClose}
      actions={
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <DetailList items={itens} />
    </Dialog>
  );
}
