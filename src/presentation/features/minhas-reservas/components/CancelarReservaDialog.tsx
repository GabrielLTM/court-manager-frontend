import type { ReservaDetalhada } from '@/application/dto';
import { Button, DetailList, Dialog } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useCancelarReserva } from '@/presentation/queries';
import { linhasCancelamento, mensagemReservaCancelada } from '../minhasReservas.utils';

export interface CancelarReservaDialogProps {
  reserva: ReservaDetalhada;
  onClose: () => void;
}

const ignorar = () => {};

/** RF12 — confirmação do cancelamento; o backend aplica a janela de 4 horas (RN08). */
export function CancelarReservaDialog({ reserva, onClose }: CancelarReservaDialogProps) {
  const cancelar = useCancelarReserva();
  const toast = useToast();

  const confirmar = async () => {
    try {
      await cancelar.mutateAsync(reserva.id);
      toast.success(mensagemReservaCancelada(reserva.id));
    } catch (erro) {
      toast.error(getErrorMessage(erro));
    } finally {
      onClose();
    }
  };

  return (
    <Dialog
      open
      title="Cancelar reserva?"
      onClose={cancelar.isPending ? ignorar : onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={cancelar.isPending}>
            Manter
          </Button>
          <Button variant="primary" loading={cancelar.isPending} onClick={() => void confirmar()}>
            Cancelar reserva
          </Button>
        </>
      }
    >
      <DetailList items={linhasCancelamento(reserva)} />
    </Dialog>
  );
}
