import { useMemo, useState, type ReactNode } from 'react';
import type { ReservaDetalhada } from '@/application/dto';
import { janelaDeReserva } from '@/domain/rules';
import { DateSelector } from '@/presentation/components/DateSelector/DateSelector';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/presentation/components/ui';
import { pluralizar } from '@/presentation/features/admin/shared/format';
import { useHoje } from '@/presentation/hooks/useHoje';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useQuadras, useReservas } from '@/presentation/queries';
import { addDays, diaDaSemanaCurto, formatDataLonga } from '@/shared/lib/date';
import { AlterarReservaDialog } from './components/AlterarReservaDialog';
import { GradeLegenda } from './components/GradeLegenda';
import { GradeTabela } from './components/GradeTabela';
import { ReservaDetalheDialog } from './components/ReservaDetalheDialog';
import { contarReservasAtivas, montarGrade, type CelulaGrade } from './grade.utils';
import styles from './GradeReservasPage.module.css';

/** Até quantos dias para trás o administrador pode consultar a grade. */
const DIAS_DE_HISTORICO = 30;

type DialogoAberto = { tipo: 'detalhe' | 'alterar'; reserva: ReservaDetalhada } | null;

/** /admin/reservas — acompanhar reservas por data, horário e quadra. */
export default function GradeReservasPage() {
  const { hoje } = useHoje();
  const toast = useToast();
  const [data, setData] = useState(hoje);
  const [dialogo, setDialogo] = useState<DialogoAberto>(null);

  const quadrasQuery = useQuadras();
  const reservasQuery = useReservas({ data });

  const quadras = quadrasQuery.data;
  const reservas = reservasQuery.data;
  const linhas = useMemo(
    () => (quadras ? montarGrade({ quadras, reservas: reservas ?? [], data }) : []),
    [quadras, reservas, data],
  );

  const selecionarCelula = (celula: CelulaGrade) => {
    if (celula.tipo === 'reservada') setDialogo({ tipo: 'detalhe', reserva: celula.reserva });
    else toast.show(celula.mensagem);
  };

  let conteudo: ReactNode;
  if (quadrasQuery.isPending) {
    conteudo = <LoadingState label="Carregando grade…" />;
  } else if (quadrasQuery.isError || reservasQuery.isError) {
    const erro = quadrasQuery.error ?? reservasQuery.error;
    conteudo = (
      <ErrorState
        message={getErrorMessage(erro)}
        onRetry={() => void (quadrasQuery.isError ? quadrasQuery.refetch() : reservasQuery.refetch())}
      />
    );
  } else if (quadrasQuery.data.length === 0) {
    conteudo = (
      <EmptyState title="Nenhuma quadra cadastrada" description="Cadastre quadras para acompanhar a grade." />
    );
  } else {
    conteudo = (
      <GradeTabela
        data={data}
        quadras={quadrasQuery.data}
        linhas={linhas}
        carregando={reservasQuery.isPending}
        onSelecionar={selecionarCelula}
      />
    );
  }

  return (
    <>
      <PageHeader title="Grade de reservas" />
      <div className={styles.page}>
        <DateSelector
          value={data}
          onChange={setData}
          inicio={hoje}
          min={addDays(hoje, -DIAS_DE_HISTORICO)}
          max={janelaDeReserva(hoje).fim}
        />
        <p className={styles.selecionada} aria-live="polite">
          Exibindo {diaDaSemanaCurto(data)}, {formatDataLonga(data)}
          {reservas && ` · ${pluralizar(contarReservasAtivas(reservas, data), 'reserva', 'reservas')}`}
        </p>
        <Card padding="md" scrollX>
          {conteudo}
        </Card>
        <GradeLegenda />
      </div>

      {dialogo?.tipo === 'detalhe' && (
        <ReservaDetalheDialog
          reserva={dialogo.reserva}
          onClose={() => setDialogo(null)}
          onAlterar={(reserva) => setDialogo({ tipo: 'alterar', reserva })}
        />
      )}
      {dialogo?.tipo === 'alterar' && (
        <AlterarReservaDialog reserva={dialogo.reserva} onClose={() => setDialogo(null)} />
      )}
    </>
  );
}
