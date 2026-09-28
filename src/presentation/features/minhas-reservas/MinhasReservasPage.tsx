import { AsyncContent, PageHeader } from '@/presentation/components/ui';
import { useReservas } from '@/presentation/queries';
import { MinhasReservasConteudo } from './components/MinhasReservasConteudo';

/** /minhas-reservas — reservas do cliente logado (a aplicação restringe ao próprio cliente). */
export default function MinhasReservasPage() {
  const reservas = useReservas();
  return (
    <>
      <PageHeader title="Minhas reservas" />
      <AsyncContent query={reservas} loadingLabel="Carregando suas reservas…">
        {(lista) => <MinhasReservasConteudo reservas={lista} />}
      </AsyncContent>
    </>
  );
}
