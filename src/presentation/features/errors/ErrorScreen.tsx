import clsx from 'clsx';
import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { BrandMark, Card, CardKicker } from '@/presentation/components/ui';
import styles from './ErrorScreen.module.css';

export interface ErrorScreenProps {
  /** Código em destaque (ex.: "404"). */
  code?: string;
  kicker?: string;
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  /** Detalhes técnicos (exibidos só em desenvolvimento). */
  details?: string;
  /** Dentro do layout autenticado: sem a marca e sem ocupar a tela inteira. */
  embedded?: boolean;
}

/** Moldura das telas de erro (404 e falhas de rota), no visual da arena. */
export function ErrorScreen({
  code,
  kicker,
  title,
  description,
  actions,
  details,
  embedded = false,
}: ErrorScreenProps) {
  const titleId = useId();

  const card = (
    <Card
      as="section"
      elevation={embedded ? 'sm' : 'lg'}
      padding="lg"
      gap="lg"
      className={styles.card}
      aria-labelledby={titleId}
    >
      {code && (
        <span className={styles.code} aria-hidden>
          {code}
        </span>
      )}
      <div className={styles.text}>
        {kicker && <CardKicker>{kicker}</CardKicker>}
        <h1 id={titleId} className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
      </div>
      {details && <pre className={styles.details}>{details}</pre>}
      <div className={styles.actions}>{actions}</div>
    </Card>
  );

  if (embedded) return <div className={styles.embedded}>{card}</div>;

  return (
    <main className={styles.screen}>
      <Link to="/" className={styles.brandLink} aria-label="Arena Beach Tennis — página inicial">
        <BrandMark size="lg" />
      </Link>
      {card}
    </main>
  );
}

/** Link com aparência de botão primário que leva para a home do perfil (ou para o login). */
export function HomeButtonLink({ className }: { className?: string }) {
  return (
    <Link to="/" className={clsx('btn', 'btn-primary', className)}>
      Voltar para o início
    </Link>
  );
}
