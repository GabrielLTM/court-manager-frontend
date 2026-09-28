import { AsyncContent, PageHeader } from '@/presentation/components/ui';
import { useQuadras } from '@/presentation/queries';
import { ReservaForm } from './components/ReservaForm';

/** /reservar — o cliente escolhe data, quadra, duração e horário e confirma com o pagamento. */
export default function ReservarPage() {
  const quadras = useQuadras();
  return (
    <>
      <PageHeader title="Reservar quadra" />
      <AsyncContent query={quadras} loadingLabel="Carregando quadras…">
        {(lista) => <ReservaForm quadras={lista} />}
      </AsyncContent>
    </>
  );
}
