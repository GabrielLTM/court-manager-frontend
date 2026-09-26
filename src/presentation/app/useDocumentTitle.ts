import { useEffect } from 'react';
import { useMatches } from 'react-router';
import { tituloDasRotas, tituloDoDocumento } from './routeHandle';

/** Mantém document.title sincronizado com o `handle.title` da rota ativa. */
export function useDocumentTitle(): void {
  const titulo = tituloDasRotas(useMatches());

  useEffect(() => {
    document.title = tituloDoDocumento(titulo);
  }, [titulo]);
}
