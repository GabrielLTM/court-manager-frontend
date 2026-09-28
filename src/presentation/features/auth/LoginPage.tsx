import { useLocation, useNavigate } from 'react-router';
import {
  BrandMark,
  Card,
  SegmentedControl,
  Tag,
  type SegmentedOption,
} from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';
import { CadastroForm } from './CadastroForm';
import { LoginForm } from './LoginForm';
import styles from './LoginPage.module.css';

export type ModoAcesso = 'entrar' | 'criar';

export interface LoginPageProps {
  /** "entrar" em /login, "criar" em /cadastro. */
  modo: ModoAcesso;
}

const ABAS: ReadonlyArray<SegmentedOption<ModoAcesso>> = [
  { value: 'entrar', label: 'Entrar' },
  { value: 'criar', label: 'Criar conta' },
];

/** Tela de acesso (protótipo, linhas 353–402): apresentação da arena + card de login/cadastro. */
export default function LoginPage({ modo }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Troca de aba = troca de rota, preservando `state.from` para o redirecionamento pós-login.
  const trocarAba = (aba: ModoAcesso) => {
    if (aba !== modo)
      navigate(aba === 'criar' ? ROUTES.cadastro : ROUTES.login, { state: location.state });
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="acesso-titulo">
        <BrandMark size="lg" className={styles.brand} />
        <h1 id="acesso-titulo" className={styles.title}>
          Sua quadra, reservada em três toques.
        </h1>
        <p className={styles.lead}>
          Consulte a disponibilidade das quadras, escolha o horário e acompanhe o pagamento.
          Administradores gerenciam clientes, quadras, reservas e pagamentos na mesma aplicação.
        </p>
        <div className={styles.tags}>
          <Tag tone="accent-2">6 quadras</Tag>
          <Tag tone="accent-2">07h às 22h</Tag>
        </div>
      </section>

      <Card
        as="section"
        elevation="lg"
        padding="lg"
        gap="lg"
        className={styles.card}
        aria-labelledby="acesso-card-titulo"
      >
        <SegmentedControl
          ariaLabel="Entrar ou criar conta"
          options={ABAS}
          value={modo}
          onChange={trocarAba}
          className={styles.tabs}
        />
        <h2 id="acesso-card-titulo" className={styles.cardTitle}>
          {modo === 'criar' ? 'Criar sua conta' : 'Bem-vindo de volta'}
        </h2>
        {modo === 'criar' ? <CadastroForm /> : <LoginForm />}
      </Card>
    </main>
  );
}
