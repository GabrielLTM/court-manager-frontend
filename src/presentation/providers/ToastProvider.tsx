import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastApi, type ToastTone } from './ToastContext';
import styles from './ToastProvider.module.css';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURACAO_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToast(null), tone === 'error' ? DURACAO_MS + 1400 : DURACAO_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={clsx(styles.toast, styles[toast.tone])}>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
