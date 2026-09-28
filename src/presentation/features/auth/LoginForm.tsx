import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { isMockMode } from '@/config/env';
import { Button, Field, Input } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useAuth } from '@/presentation/providers/AuthContext';
import { useToast } from '@/presentation/providers/ToastContext';
import { loginSchema, type LoginFormValues } from '@/presentation/validation/schemas';
import { primeiroNome } from '@/shared/lib/format';
import { AcessoRapido } from './AcessoRapido';
import styles from './AuthForm.module.css';

/**
 * Aba "Entrar" (POST /api/auth/login). Após o login, o guard das rotas públicas redireciona
 * para a página de origem ou para a home do perfil.
 */
export function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const preencher = ({ email, senha }: LoginFormValues) => {
    const opcoes = { shouldDirty: true, shouldValidate: true } as const;
    setValue('email', email, opcoes);
    setValue('senha', senha, opcoes);
  };

  const entrar = handleSubmit(async (valores) => {
    try {
      const sessao = await login(valores);
      toast.success(`Bem-vindo(a), ${primeiroNome(sessao.usuario.nome)}!`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível entrar. Tente novamente.'));
      setFocus('senha', { shouldSelect: true });
    }
  });

  return (
    <form className={styles.form} onSubmit={entrar} noValidate aria-label="Entrar">
      <Field label="E-mail" htmlFor="login-email" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          inputMode="email"
          placeholder="voce@email.com"
          autoComplete="username"
          invalid={!!errors.email}
          {...register('email')}
        />
      </Field>

      <Field label="Senha" htmlFor="login-senha" error={errors.senha?.message}>
        <Input
          id="login-senha"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          invalid={!!errors.senha}
          {...register('senha')}
        />
      </Field>

      {isMockMode && <AcessoRapido control={control} onEscolher={preencher} />}

      <Button type="submit" variant="primary" size="lg" block loading={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
