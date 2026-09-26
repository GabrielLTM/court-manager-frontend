import { useId, useState, type FormEvent, type ReactNode } from 'react';
import type { ReservaDetalhada } from '@/application/dto';
import type { Slot } from '@/domain/entities';
import {
  MOTIVO_INDISPONIBILIDADE_LABEL,
  REGRAS_RESERVA,
  calcularHoraFim,
  calcularValorReserva,
  janelaDeReserva,
  quadraPodeSerReservada,
} from '@/domain/rules';
import { SlotGrid, SlotLegend } from '@/presentation/components/SlotGrid/SlotGrid';
import { Button, Dialog, ErrorState, Field, Input, LoadingState, Pill, Select } from '@/presentation/components/ui';
import { formatPeriodoReserva } from '@/presentation/features/admin/shared/format';
import { useHoje } from '@/presentation/hooks/useHoje';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAlterarReserva, useDisponibilidade, useQuadras } from '@/presentation/queries';
import { isISODate } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva, formatDuracaoLonga } from '@/shared/lib/format';
import { duracaoInicial, horarioDisponivel, houveAlteracao, slotsDaAlteracao } from '../reserva.utils';
import styles from './AlterarReservaDialog.module.css';

export interface AlterarReservaDialogProps {
  reserva: ReservaDetalhada;
  onClose: () => void;
}

/** RF13 — altera quadra, data, duração e horário de uma reserva (revalidado no backend — RN04). */
export function AlterarReservaDialog({ reserva, onClose }: AlterarReservaDialogProps) {
  const { hoje, agora } = useHoje();
  const toast = useToast();
  const quadrasQuery = useQuadras();
  const alterar = useAlterarReserva();
  const formId = useId();
  const duracaoLabelId = useId();

  const [quadraId, setQuadraId] = useState(reserva.quadraId);
  const [data, setData] = useState(reserva.data);
  const [duracao, setDuracao] = useState(() => duracaoInicial(reserva));
  const [horaInicio, setHoraInicio] = useState<string | null>(reserva.horaInicio);

  const codigo = formatCodigoReserva(reserva.id);
  const janela = janelaDeReserva(hoje);
  const quadrasAtivas = (quadrasQuery.data ?? []).filter((q) => quadraPodeSerReservada(q));
  const quadra = quadrasAtivas.find((q) => q.id === quadraId) ?? quadrasAtivas[0] ?? null;
  const dataValida = isISODate(data);
  const disponibilidade = useDisponibilidade(quadra && dataValida ? quadra.id : null, data);

  const slots =
    quadra && disponibilidade.data
      ? slotsDaAlteracao({
          reserva,
          quadra,
          data,
          duracaoMinutos: duracao,
          disponibilidade: disponibilidade.data,
          agora,
        })
      : [];
  const escolhaValida = horarioDisponivel(slots, horaInicio);
  const alterado = houveAlteracao(reserva, {
    quadraId: quadra?.id ?? null,
    data,
    duracaoMinutos: duracao,
    horaInicio,
  });
  const podeSalvar = quadra !== null && escolhaValida && alterado;

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!podeSalvar || !quadra || !horaInicio) return;
    try {
      await alterar.mutateAsync({
        id: reserva.id,
        input: { quadraId: quadra.id, data, horaInicio, duracaoMinutos: duracao },
      });
      toast.success(`Reserva ${codigo} alterada`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const avisarIndisponivel = (slot: Slot) =>
    toast.show(slot.motivo ? MOTIVO_INDISPONIBILIDADE_LABEL[slot.motivo] : 'Horário indisponível nesta quadra');

  let horarios: ReactNode;
  if (!dataValida) {
    horarios = <p className={styles.nota}>Informe uma data válida para consultar os horários.</p>;
  } else if (!quadra) {
    horarios = quadrasQuery.isPending ? (
      <LoadingState label="Carregando quadras…" />
    ) : (
      <p className={styles.nota}>Nenhuma quadra ativa para receber a reserva.</p>
    );
  } else if (disponibilidade.isError) {
    horarios = (
      <ErrorState message={getErrorMessage(disponibilidade.error)} onRetry={() => void disponibilidade.refetch()} />
    );
  } else if (!disponibilidade.data) {
    horarios = <LoadingState label="Consultando horários…" />;
  } else {
    horarios = (
      <>
        <SlotGrid
          slots={slots}
          selecionado={horaInicio}
          onSelecionar={setHoraInicio}
          onIndisponivel={avisarIndisponivel}
          ariaLabel="Horários de início"
        />
        <SlotLegend />
      </>
    );
  }

  const resumo =
    quadra && horaInicio && escolhaValida
      ? `${quadra.nome} · ${formatPeriodoReserva({
          data,
          horaInicio,
          horaFim: calcularHoraFim(horaInicio, duracao),
        })} · ${formatBRL(calcularValorReserva(quadra.valorHora, duracao))}`
      : 'Selecione um horário disponível.';

  return (
    <Dialog
      open
      size="lg"
      variant="form"
      title={`Alterar reserva ${codigo}`}
      onClose={onClose}
      closeOnBackdrop={false}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={alterar.isPending} disabled={!podeSalvar}>
            Salvar alteração
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(event) => void salvar(event)} noValidate>
        <p className={styles.nota}>
          Atual: {reserva.quadra?.nome ?? 'Quadra'} · {formatPeriodoReserva(reserva)} · {formatBRL(reserva.valor)}
        </p>

        <div className={styles.row}>
          <Field label="Quadra" htmlFor={`${formId}-quadra`}>
            <Select
              id={`${formId}-quadra`}
              value={quadra?.id ?? ''}
              onChange={(event) => setQuadraId(Number(event.target.value))}
              disabled={quadrasAtivas.length === 0}
            >
              {quadrasAtivas.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nome} · {q.tipo}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Data"
            htmlFor={`${formId}-data`}
            error={dataValida ? undefined : 'Informe uma data válida.'}
          >
            <Input
              id={`${formId}-data`}
              type="date"
              min={janela.inicio}
              max={janela.fim}
              value={data}
              onChange={(event) => setData(event.target.value)}
              required
              invalid={!dataValida}
            />
          </Field>
        </div>

        <div className={styles.grupo}>
          <span id={duracaoLabelId} className={styles.rotulo}>
            Duração
          </span>
          <div className={styles.pills} role="group" aria-labelledby={duracaoLabelId}>
            {REGRAS_RESERVA.duracoesMinutos.map((minutos) => (
              <Pill key={minutos} size="md" active={minutos === duracao} onClick={() => setDuracao(minutos)}>
                {formatDuracaoLonga(minutos)}
              </Pill>
            ))}
          </div>
        </div>

        <div className={styles.grupo}>
          <span className={styles.rotulo} aria-hidden>
            Horário de início
          </span>
          {horarios}
        </div>

        <p className={styles.resumo} aria-live="polite">
          {resumo}
        </p>
      </form>
    </Dialog>
  );
}
