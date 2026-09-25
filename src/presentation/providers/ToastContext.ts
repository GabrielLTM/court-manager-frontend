import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastApi {
  show(message: string, tone?: ToastTone): void;
  success(message: string): void;
  error(message: string): void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Mensagens de sucesso, alerta e erro (pílula flutuante do protótipo). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return ctx;
}
