import { useState } from 'react';
import type { Quadra } from '@/domain/entities';
import { AsyncContent, Button, EmptyState, PageHeader } from '@/presentation/components/ui';
import { useQuadras } from '@/presentation/queries';
import { QuadraCard } from './components/QuadraCard';
import { QuadraFormDialog } from './components/QuadraFormDialog';
import { sugerirNomeQuadra } from './quadras.utils';
import styles from './QuadrasPage.module.css';

/** /admin/quadras — cadastro, edição e status das quadras (RF05–RF08). */
export default function QuadrasPage() {
  const quadrasQuery = useQuadras();
  /** `undefined` = fechado; `null` = nova quadra; objeto = edição. */
  const [emEdicao, setEmEdicao] = useState<Quadra | null | undefined>(undefined);

  return (
    <>
      <PageHeader
        title="Quadras"
        actions={
          <Button variant="primary" onClick={() => setEmEdicao(null)}>
            + Nova quadra
          </Button>
        }
      />
      <AsyncContent query={quadrasQuery} loadingLabel="Carregando quadras…">
        {(quadras) =>
          quadras.length === 0 ? (
            <EmptyState title="Nenhuma quadra cadastrada" description="Cadastre a primeira quadra da arena." />
          ) : (
            <div className={styles.grid}>
              {quadras.map((quadra) => (
                <QuadraCard key={quadra.id} quadra={quadra} onEditar={setEmEdicao} />
              ))}
            </div>
          )
        }
      </AsyncContent>

      {emEdicao !== undefined && (
        <QuadraFormDialog
          key={emEdicao?.id ?? 'nova'}
          quadra={emEdicao}
          sugestaoNome={sugerirNomeQuadra(quadrasQuery.data ?? [])}
          onClose={() => setEmEdicao(undefined)}
        />
      )}
    </>
  );
}
