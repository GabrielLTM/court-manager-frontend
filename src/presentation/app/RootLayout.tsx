import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { FullPageLoading } from './FullPageLoading';
import { useDocumentTitle } from './useDocumentTitle';

/**
 * Rota raiz: título do documento por rota e rolagem ao topo a cada navegação
 * (o ScrollRestoration também restaura a posição ao voltar/avançar no histórico).
 */
export function RootLayout() {
  useDocumentTitle();

  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<FullPageLoading />}>
        <Outlet />
      </Suspense>
    </>
  );
}
