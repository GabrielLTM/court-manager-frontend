import { Fragment, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ReservaDetalhada } from '@/application/dto';
import { Button, DetailList, Dialog, StatusTag } from '@/presentation/components/ui';
import { descreverPagamento, formatPeriodoReserva } from '@/presentation/features/admin/shared/format';
import { useHoje } from '@/presentation/hooks/useHoje';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useCancelarReserva } from '@/presentation/queries';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { acoesDaReserva, avisoDoPagamentoAoCancelar } from '../reserva.utils';
import styles from './ReservaDetalheDialog.module.css';

export interface ReservaDetalheDialogProps {
  reserva: ReservaDetalhada;
  onClose: () => void;
  onAlterar: (reserva: ReservaDetalhada) => void;
}

/** Detalhe da reserva clicada na grade, com alteração (RF13) e cancelamento (RF12). */
export function ReservaDetalheDialog({ reserva, onClose, onAlterar }: ReservaDetalheDialogProps) {
  const { agora } = useHoje();
  const toast = useToast();
  const cancelar = useCancelarReserva();
  const [confirmando, setConfirmando] = useState(false);
  const manterRef = useRef<HTMLButtonElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  const codigo = formatCodigoReserva(reserva.id);
  const { status, podeAlterar, podeCancelar } = acoesDaReserva(reserva, agora);

  // Os botões do rodapé são trocados entre as etapas: o foco acompanha a troca
  // ("Manter" ao pedir confirmação; "Cancelar reserva" ao voltar ao detalhe).
  const pedirConfirmacao = () => {
    flushSync(() => setConfirmando(true));
    manterRef.current?.focus();
  };
  const voltarAoDetalhe = () => {
    flushSync(() => setConfirmando(false));
    cancelarRef.current?.focus();
  };

  const confirmarCancelamento = async () => {
    try {
      await cancelar.mutateAsync(reserva.id);
      toast.success(`Reserva ${codigo} cancelada — horário liberado`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
      voltarAoDetalhe();
    }
  };

  const actions = confirmando ? (
    <Fragment key="confirmacao">
      <Button ref={manterRef} variant="secondary" onClick={voltarAoDetalhe} disabled={cancelar.isPending}>
        Manter
      </Button>
      <Button variant="primary" onClick={() => void confirmarCancelamento()} loading={cancelar.isPending}>
        Confirmar cancelamento
      </Button>
    </Fragment>
  ) : (
    <Fragment key="detalhe">
      <Button variant="secondary" onClick={onClose}>
        Fechar
      </Button>
      {podeAlterar && (
        <Button variant="secondary" onClick={() => onAlterar(reserva)}>
          Alterar
        </Button>
      )}
      {podeCancelar && (
        <Button ref={cancelarRef} variant="primary" onClick={pedirConfirmacao}>
          Cancelar reserva
        </Button>
      )}
    </Fragment>
  );

  return (
    <Dialog open title={codigo} onClose={onClose} actions={actions}>
      <DetailList
        items={[
          { label: 'Cliente', value: reserva.cliente?.nome ?? '—' },
          { label: 'Quadra', value: reserva.quadra?.nome ?? '—' },
          { label: 'Horário', value: formatPeriodoReserva(reserva) },
          { label: 'Valor', value: formatBRL(reserva.valor) },
          { label: 'Pagamento', value: descreverPagamento(reserva.pagamento) },
          { label: 'Status', value: <StatusTag kind="reserva" status={status} /> },
        ]}
      />
      {confirmando && (
        <p className={styles.aviso} role="alert">
          Confirma o cancelamento desta reserva? {avisoDoPagamentoAoCancelar(reserva.pagamento)}
        </p>
      )}
    </Dialog>
  );
}
