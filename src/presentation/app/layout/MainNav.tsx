import { NavLink } from 'react-router';
import type { Perfil } from '@/domain/enums';
import { pillClassName } from '@/presentation/components/ui';
import styles from './AppLayout.module.css';
import { NAVEGACAO } from './navigation';

/** Navegação principal: pílulas "plain" com a página atual destacada (aria-current="page"). */
export function MainNav({ perfil }: { perfil: Perfil }) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {NAVEGACAO[perfil].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            pillClassName({ tone: 'plain', active: isActive })
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
