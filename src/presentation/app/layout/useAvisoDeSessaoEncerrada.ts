import { useCallback, useEffect, useRef } from 'react';
import { useServices } from '@/presentation/providers/ServicesContext';
import { useToast } from '@/presentation/providers/ToastContext';

export const MENSAGEM_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.';

/**
 * Avisa quando a sessão termina sem o usuário clicar em "Sair" (token expirado, 401 da API ou
 * logout em outra aba). O redirecionamento para /login fica a cargo do RequireAuth.
 * Retorna a função que marca a saída como voluntária (chame-a antes do logout).
 */
export function useAvisoDeSessaoEncerrada(): () => void {
  const { auth } = useServices();
  const toast = useToast();
  const saidaVoluntaria = useRef(false);

  useEffect(
    () =>
      auth.subscribe(() => {
        if (auth.sessaoAtual() === null && !saidaVoluntaria.current) {
          toast.show(MENSAGEM_SESSAO_EXPIRADA);
        }
      }),
    [auth, toast],
  );

  return useCallback(() => {
    saidaVoluntaria.current = true;
  }, []);
}
