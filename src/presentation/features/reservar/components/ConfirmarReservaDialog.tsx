import type { MetodoPagamento } from '@/domain/enums';
import { Button, DetailList, Dialog } from '@/presentation/components/ui';
import { linhasConfirmacao, type ReservaPendente } from '../reservar.utils';
import { MetodoPagamentoPicker } from '@/presentation/components/MetodoPagamentoPicker/MetodoPagamentoPicker';

export interface ConfirmarReservaDialogProps {
  reserva: ReservaPendente;
  metodo: MetodoPagamento;
  onMetodoChange: (metodo: MetodoPagamento) => void;
  enviando: boolean;
  onConfirmar: () => void;
  onClose: () => void;
}

const ignorar = () => {};

/** Diálogo "Confirmar reserva": resumo + método de pagamento (RF09 + RF14). */
export function ConfirmarReservaDialog({
  reserva,
  metodo,
  onMetodoChange,
  enviando,
  onConfirmar,
  onClose,
}: ConfirmarReservaDialogProps) {
  return (
    <Dialog
      open
      title="Confirmar reserva"
      onClose={enviando ? ignorar : onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Voltar
          </Button>
          <Button variant="primary" loading={enviando} onClick={onConfirmar}>
            Confirmar e pagar
          </Button>
        </>
      }
    >
      <DetailList items={linhasConfirmacao(reserva)} />
      <MetodoPagamentoPicker value={metodo} onChange={onMetodoChange} disabled={enviando} />
    </Dialog>
  );
}
