import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { Button } from '@/presentation/components/ui';
import { ErrorScreen, HomeButtonLink } from './ErrorScreen';
import { descreverErroDeRota, detalhesTecnicos } from './errorInfo';

export interface RouteErrorPageProps {
  /** Renderizada dentro do AppLayout (erro de uma página), mantendo cabeçalho e navegação. */
  embedded?: boolean;
}

/** `errorElement` das rotas: mensagem amigável + caminho de volta para a home. */
export default function RouteErrorPage({ embedded = false }: RouteErrorPageProps) {
  const error = useRouteError();
  const info = descreverErroDeRota(error);

  useEffect(() => {
    if (!embedded) document.title = `${info.titulo} · Arena Beach Tennis`;
  }, [embedded, info.titulo]);

  return (
    <ErrorScreen
      embedded={embedded}
      code={info.codigo}
      kicker={info.kicker}
      title={info.titulo}
      description={info.descricao}
      details={import.meta.env.DEV ? detalhesTecnicos(error) : undefined}
      actions={
        <>
          <HomeButtonLink />
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </>
      }
    />
  );
}
