import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import { SegmentedControl, type SegmentedOption } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useAuth } from '@/presentation/providers/AuthContext';
import { useToast } from '@/presentation/providers/ToastContext';
import { homePathFor } from '@/presentation/routes/paths';

const OPCOES: ReadonlyArray<SegmentedOption<Perfil>> = [
  { value: Perfil.Cliente, label: 'Cliente' },
  { value: Perfil.Administrador, label: 'Admin' },
];

/**
 * "Cliente | Admin" do protótipo (somente no modo mock): entra com a outra conta de demonstração
 * e abre a home desse perfil.
 */
export function DemoRoleSwitch({ perfil, className }: { perfil: Perfil; className?: string }) {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [trocando, setTrocando] = useState(false);

  async function trocar(destino: Perfil) {
    if (destino === perfil || trocando) return;
    setTrocando(true);
    try {
      const { email, senha } = CONTAS_DEMO[destino];
      const sessao = await login({ email, senha });
      navigate(homePathFor(sessao.usuario.perfil), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível trocar de perfil.'));
    } finally {
      setTrocando(false);
    }
  }

  return (
    <SegmentedControl
      ariaLabel="Perfil de demonstração"
      options={OPCOES}
      value={perfil}
      onChange={(destino) => void trocar(destino)}
      className={className}
    />
  );
}
