import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Path } from 'react-hook-form';
import { ClienteFields } from '@/presentation/components/forms/ClienteFields';
import { Button } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useAuth } from '@/presentation/providers/AuthContext';
import { useToast } from '@/presentation/providers/ToastContext';
import { cadastroSchema, type CadastroFormValues } from '@/presentation/validation/schemas';
import { primeiroNome } from '@/shared/lib/format';
import styles from './AuthForm.module.css';
import { aplicarErrosDoServidor } from '@/presentation/lib/serverErrors';

const VALORES_INICIAIS: CadastroFormValues = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  senha: '',
};

const CAMPOS = Object.keys(VALORES_INICIAIS) as Array<Path<CadastroFormValues>>;

/** Aba "Criar conta" — autocadastro do cliente (RF01, POST /api/auth/register). */
export function CadastroForm() {
  const { registrar } = useAuth();
  const toast = useToast();
  const methods = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: VALORES_INICIAIS,
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods;

  const criarConta = handleSubmit(async (valores) => {
    try {
      const sessao = await registrar({
        ...valores,
        dataNascimento: valores.dataNascimento || null,
      });
      toast.success(`Conta criada! Bem-vindo(a), ${primeiroNome(sessao.usuario.nome)}!`);
    } catch (error) {
      aplicarErrosDoServidor(error, setError, CAMPOS);
      toast.error(getErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'));
    }
  });

  return (
    <FormProvider {...methods}>
      <form className={styles.form} onSubmit={criarConta} noValidate aria-label="Criar conta">
        <ClienteFields senha="obrigatoria" idPrefix="cadastro" />
        <Button type="submit" variant="primary" size="lg" block loading={isSubmitting}>
          Criar conta e entrar
        </Button>
        <p className={styles.endpoint}>POST /api/auth/register</p>
      </form>
    </FormProvider>
  );
}
