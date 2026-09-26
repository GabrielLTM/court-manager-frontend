import { useLocation } from 'react-router';
import { ErrorScreen, HomeButtonLink } from './ErrorScreen';

/** Rota "*": endereço inexistente. */
export default function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <ErrorScreen
      code="404"
      kicker="Página não encontrada"
      title="Bola fora!"
      description={
        <>
          O endereço <code>{pathname}</code> não existe ou foi movido. Que tal voltar para a quadra?
        </>
      }
      actions={<HomeButtonLink />}
    />
  );
}
