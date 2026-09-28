import { AsyncContent, PageHeader } from '@/presentation/components/ui';
import { usePerfil } from '@/presentation/queries';
import { PerfilForm } from './PerfilForm';

/** RF02 — o cliente logado consulta e atualiza os próprios dados cadastrais. */
export default function MeusDadosPage() {
  const perfil = usePerfil();

  return (
    <>
      <PageHeader title="Meus dados" />
      <AsyncContent query={perfil} loadingLabel="Carregando seus dados…">
        {(cliente) => <PerfilForm cliente={cliente} />}
      </AsyncContent>
    </>
  );
}
