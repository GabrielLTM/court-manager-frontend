import { useState } from 'react';
import type { ReservaDetalhada } from '@/application/dto';
import { MetodoPagamento } from '@/domain/enums';
import { Button, DetailList, Dialog } from '@/presentation/components/ui';
import { MetodoPagamentoPicker } from '@/presentation/components/MetodoPagamentoPicker/MetodoPagamentoPicker';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useRegistrarPagamento } from '@/presentation/queries';
import { linhasPagamento, mensagemPagamentoRegistrado } from '../minhasReservas.utils';

export interface PagarReservaDialogProps {
  reserva: ReservaDetalhada;
  onClose: () => void;
}

const ignorar = () => {};

/** RF14 — registra o pagamento de uma reserva que ainda não tem pagamento. */
export function PagarReservaDialog({ reserva, onClose }: PagarReservaDialogProps) {
  const registrar = useRegistrarPagamento();
  const toast = useToast();
  const [metodo, setMetodo] = useState<MetodoPagamento>(MetodoPagamento.Pix);

  const confirmar = async () => {
    try {
      const pagamento = await registrar.mutateAsync({ reservaId: reserva.id, metodo });
      toast.success(mensagemPagamentoRegistrado(pagamento));
    } catch (erro) {
      toast.error(getErrorMessage(erro));
    } finally {
      onClose();
    }
  };

  return (
    <Dialog
      open
      title="Pagar reserva"
      onClose={registrar.isPending ? ignorar : onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={registrar.isPending}>
            Voltar
          </Button>
          <Button variant="primary" loading={registrar.isPending} onClick={() => void confirmar()}>
            Confirmar pagamento
          </Button>
        </>
      }
    >
      <DetailList items={linhasPagamento(reserva)} />
      <MetodoPagamentoPicker value={metodo} onChange={setMetodo} disabled={registrar.isPending} />
    </Dialog>
  );
}
