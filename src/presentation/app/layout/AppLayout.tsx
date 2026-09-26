import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { isMockMode } from '@/config/env';
import { BrandMark, Button, LoadingState } from '@/presentation/components/ui';
import { useAuth } from '@/presentation/providers/AuthContext';
import { useToast } from '@/presentation/providers/ToastContext';
import styles from './AppLayout.module.css';
import { DemoRoleSwitch } from './DemoRoleSwitch';
import { MainNav } from './MainNav';
import { useAvisoDeSessaoEncerrada } from './useAvisoDeSessaoEncerrada';
import { UserBadge } from './UserBadge';

/** Casca das áreas autenticadas: cabeçalho, navegação por perfil e a página atual. */
export function AppLayout() {
  const { usuario, logout } = useAuth();
  const toast = useToast();
  const marcarSaidaVoluntaria = useAvisoDeSessaoEncerrada();

  if (!usuario) return null; // O RequireAuth redireciona antes de chegar aqui.

  function sair() {
    marcarSaidaVoluntaria();
    logout(); // Sem sessão, o RequireAuth leva para /login.
    toast.show('Sessão encerrada');
  }

  return (
    <div className={styles.shell}>
      <a href="#conteudo" className={styles.skipLink}>
        Pular para o conteúdo
      </a>

      <header className={styles.header}>
        <Link to="/" className={styles.brandLink} aria-label="Arena Beach Tennis — página inicial">
          <BrandMark />
        </Link>
        <div className={styles.controls}>
          {isMockMode && <DemoRoleSwitch perfil={usuario.perfil} className={styles.roleSwitch} />}
          <UserBadge usuario={usuario} />
          <Button variant="secondary" onClick={sair} className={styles.logout}>
            Sair
          </Button>
        </div>
      </header>

      <MainNav perfil={usuario.perfil} />

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
