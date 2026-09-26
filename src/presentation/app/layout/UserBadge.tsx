import clsx from 'clsx';
import type { UsuarioAutenticado } from '@/domain/entities';
import { PERFIL_LABEL } from '@/domain/enums';
import { Avatar } from '@/presentation/components/ui';
import styles from './AppLayout.module.css';

/** Avatar com iniciais + nome e perfil do usuário logado. */
export function UserBadge({
  usuario,
  className,
}: {
  usuario: UsuarioAutenticado;
  className?: string;
}) {
  return (
    <div className={clsx(styles.user, className)}>
      <Avatar nome={usuario.nome} />
      <div className={styles.userText}>
        <span className={styles.userName} title={usuario.nome}>
          {usuario.nome}
        </span>
        <span className={styles.userRole}>{PERFIL_LABEL[usuario.perfil]}</span>
      </div>
    </div>
  );
}
