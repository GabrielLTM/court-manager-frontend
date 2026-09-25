import clsx from 'clsx';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  /** Botões alinhados à direita (.dialog-actions). */
  actions?: ReactNode;
  size?: 'md' | 'lg';
  /** "form" remove a opacidade reduzida do corpo (formulários). */
  variant?: 'default' | 'form';
  closeOnBackdrop?: boolean;
}

/** Diálogo modal acessível (Esc fecha, foco gerenciado, portal no body). */
export function Dialog({
  open,
  title,
  onClose,
  children,
  actions,
  size = 'md',
  variant = 'default',
  closeOnBackdrop = true,
}: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const primeiroCampo = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea');
    (primeiroCampo ?? dialogRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={clsx('dialog-backdrop', styles.backdrop)}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        className={clsx('dialog', styles.dialog, size === 'lg' && styles.lg)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div id={titleId} className="dialog-title">
          {title}
        </div>
        {children !== undefined && (
          <div className={clsx('dialog-body', variant === 'form' && styles.form)}>{children}</div>
        )}
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
