import { useMemo, useState } from 'react';
import type { Cliente } from '@/domain/entities';
import { AsyncContent, Button, Card, PageHeader, Pagination } from '@/presentation/components/ui';
import { usePagination } from '@/presentation/hooks/usePagination';
import { useClientes, useReservas } from '@/presentation/queries';
import { ROUTES } from '@/presentation/routes/paths';
import { contarReservasPorCliente, filtrarClientes, type FiltroStatusCliente } from './clientes.utils';
import { ClienteFormDialog } from './components/ClienteFormDialog';
import { ClientesTabela } from './components/ClientesTabela';
import { ClientesToolbar } from './components/ClientesToolbar';
import styles from './ClientesPage.module.css';

const POR_PAGINA = 8;

/** /admin/clientes — cadastro, edição e inativação de clientes (RF01–RF04). */
export default function ClientesPage() {
  const clientesQuery = useClientes();
  const reservasQuery = useReservas();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<FiltroStatusCliente>('todos');
  /** `undefined` = fechado; `null` = novo cliente; objeto = edição. */
  const [emEdicao, setEmEdicao] = useState<Cliente | null | undefined>(undefined);

  const clientes = clientesQuery.data;
  const reservas = reservasQuery.data;
  const filtrados = useMemo(() => filtrarClientes(clientes ?? [], { busca, status }), [clientes, busca, status]);
  const reservasPorCliente = useMemo(() => (reservas ? contarReservasPorCliente(reservas) : null), [reservas]);
  const { page, pageCount, pageItems, setPage, total } = usePagination(filtrados, POR_PAGINA);

  const alterarBusca = (valor: string) => {
    setBusca(valor);
    setPage(1);
  };
  const alterarStatus = (valor: FiltroStatusCliente) => {
    setStatus(valor);
    setPage(1);
  };
  const filtrando = busca.trim() !== '' || status !== 'todos';

  return (
    <>
      <PageHeader
        title="Clientes"
        route={ROUTES.admin.clientes}
        actions={
          <Button variant="primary" onClick={() => setEmEdicao(null)}>
            + Novo cliente
          </Button>
        }
      />
      <div className={styles.page}>
        <ClientesToolbar
          busca={busca}
          onBuscaChange={alterarBusca}
          status={status}
          onStatusChange={alterarStatus}
        />
        <Card padding="md" gap="md">
          <AsyncContent query={clientesQuery} loadingLabel="Carregando clientes…">
            {() => (
              <>
                <ClientesTabela
                  clientes={pageItems}
                  reservasPorCliente={reservasPorCliente}
                  onEditar={setEmEdicao}
                  emptyMessage={filtrando ? 'Nenhum cliente encontrado para os filtros.' : 'Nenhum cliente cadastrado.'}
                />
                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={total} />
              </>
            )}
          </AsyncContent>
        </Card>
      </div>

      {emEdicao !== undefined && (
        <ClienteFormDialog
          key={emEdicao?.id ?? 'novo'}
          cliente={emEdicao}
          onClose={() => setEmEdicao(undefined)}
        />
      )}
    </>
  );
}
