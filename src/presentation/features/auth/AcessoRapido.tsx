import { useId } from 'react';
import { useWatch, type Control } from 'react-hook-form';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import { Pill } from '@/presentation/components/ui';
import type { LoginFormValues } from '@/presentation/validation/schemas';
import styles from './AuthForm.module.css';

const PERFIS_DEMO = [Perfil.Cliente, Perfil.Administrador] as const;

export interface AcessoRapidoProps {
  control: Control<LoginFormValues>;
  onEscolher: (credenciais: LoginFormValues) => void;
}

/**
 * "Entrar como (protótipo)" → preenche o formulário com uma conta de demonstração do backend
 * simulado. A pílula fica ativa enquanto o formulário contém exatamente aquelas credenciais.
 */
export function AcessoRapido({ control, onEscolher }: AcessoRapidoProps) {
  const [email = '', senha = ''] = useWatch({ control, name: ['email', 'senha'] });
  const tituloId = useId();

  return (
    <div role="group" aria-labelledby={tituloId}>
      <div id={tituloId} className={styles.quickLabel}>
        Acessar como
      </div>
      <div className={styles.quickPills}>
        {PERFIS_DEMO.map((perfil) => {
          const conta = CONTAS_DEMO[perfil];
          const ativa = email.trim().toLowerCase() === conta.email && senha === conta.senha;
          return (
            <Pill
              key={perfil}
              active={ativa}
              onClick={() => onEscolher({ email: conta.email, senha: conta.senha })}
            >
              {conta.rotulo}
            </Pill>
          );
        })}
      </div>
    </div>
  );
}
