import { useMemo, useState } from 'react';
import type { PagamentoDetalhado } from '@/application/dto';
import { AsyncContent, Card, PageHeader, Pagination } from '@/presentation/components/ui';
import { FiltroPills } from '@/presentation/features/admin/shared/FiltroPills';
import { usePagination } from '@/presentation/hooks/usePagination';
import { usePagamentos } from '@/presentation/queries';
import { ROUTES } from '@/presentation/routes/paths';
import { PagamentosResumo } from './components/PagamentosResumo';
import { PagamentosTabela } from './components/PagamentosTabela';
import { ReciboDialog } from './components/ReciboDialog';
import { FILTROS_PAGAMENTO, filtrarPagamentos, resumirPagamentos, type FiltroPagamento } from './pagamentos.utils';
import styles from './PagamentosPage.module.css';

const POR_PAGINA = 8;

/** /admin/pagamentos — acompanhamento e confirmação de pagamentos (RF14–RF16). */
export default function PagamentosPage() {
  const pagamentosQuery = usePagamentos();
  const [filtro, setFiltro] = useState<FiltroPagamento>('todos');
  const [recibo, setRecibo] = useState<PagamentoDetalhado | null>(null);

  const pagamentos = pagamentosQuery.data;
  const resumo = useMemo(() => resumirPagamentos(pagamentos ?? []), [pagamentos]);
  const filtrados = useMemo(() => filtrarPagamentos(pagamentos ?? [], filtro), [pagamentos, filtro]);
  const { page, pageCount, pageItems, setPage, total } = usePagination(filtrados, POR_PAGINA);

  const alterarFiltro = (valor: FiltroPagamento) => {
    setFiltro(valor);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Pagamentos" route={ROUTES.admin.pagamentos} />
      <AsyncContent query={pagamentosQuery} loadingLabel="Carregando pagamentos…">
        {() => (
          <div className={styles.page}>
            <PagamentosResumo resumo={resumo} />
            <FiltroPills
              options={FILTROS_PAGAMENTO}
              value={filtro}
              onChange={alterarFiltro}
              ariaLabel="Filtrar pagamentos por status"
            />
            <Card padding="md" gap="md">
              <PagamentosTabela
                pagamentos={pageItems}
                onRecibo={setRecibo}
                emptyMessage={
                  filtro === 'todos' ? 'Nenhum pagamento registrado.' : 'Nenhum pagamento com este status.'
                }
              />
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={total} />
            </Card>
          </div>
        )}
      </AsyncContent>

      {recibo && <ReciboDialog pagamento={recibo} onClose={() => setRecibo(null)} />}
    </>
  );
}
