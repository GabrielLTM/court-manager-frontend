import { LoadingState } from '@/presentation/components/ui';
import styles from './FullPageLoading.module.css';

/** Carregamento de tela cheia (chunks das telas públicas e da página 404). */
export function FullPageLoading() {
  return (
    <div className={styles.screen}>
      <LoadingState />
    </div>
  );
}
