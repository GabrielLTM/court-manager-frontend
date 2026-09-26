import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm, type Path } from 'react-hook-form';
import type { Cliente } from '@/domain/entities';
import { ClienteFields } from '@/presentation/components/forms/ClienteFields';
import { Button, Card, CardKicker, StatusTag } from '@/presentation/components/ui';
import { aplicarErrosDoServidor } from '@/presentation/lib/serverErrors';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAtualizarPerfil } from '@/presentation/queries';
import { perfilSchema, type PerfilFormValues } from '@/presentation/validation/schemas';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
import styles from './MeusDadosPage.module.css';

const CAMPOS: ReadonlyArray<Path<PerfilFormValues>> = [
  'nome',
  'cpf',
  'dataNascimento',
  'telefone',
  'email',
  'senha',
];

function valoresDoCliente(cliente: Cliente): PerfilFormValues {
  return {
    nome: cliente.nome,
    cpf: maskCpf(cliente.cpf),
    dataNascimento: cliente.dataNascimento?.slice(0, 10) ?? '',
    telefone: maskTelefone(cliente.telefone),
    email: cliente.email,
    senha: '',
  };
}

/** Formulário "Atualizar seus dados": pré-preenchido com o cadastro e sincronizado a cada nova leitura. */
export function PerfilForm({ cliente }: { cliente: Cliente }) {
  const toast = useToast();
  const atualizar = useAtualizarPerfil();
  const valores = useMemo(() => valoresDoCliente(cliente), [cliente]);

  const methods = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: valores,
  });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, isSubmitting },
  } = methods;

  // Nova leitura do cadastro (ex.: após salvar) → reinicia o formulário sem descartar o que está em edição.
  useEffect(() => {
    reset(valores, { keepDirtyValues: true });
  }, [valores, reset]);

  const salvar = handleSubmit(async ({ senha, ...dados }) => {
    try {
      // Senha vazia = manter a atual (o campo nem é enviado).
      const atualizado = await atualizar.mutateAsync(senha ? { ...dados, senha } : dados);
      reset(valoresDoCliente(atualizado));
      toast.success('Dados atualizados');
    } catch (error) {
      aplicarErrosDoServidor(error, setError, CAMPOS);
      toast.error(getErrorMessage(error, 'Não foi possível salvar seus dados.'));
    }
  });

  return (
    <Card
      as="section"
      elevation="sm"
      padding="lg"
      gap="lg"
      className={styles.card}
      aria-labelledby="perfil-titulo"
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <CardKicker>Seu cadastro</CardKicker>
          <h2 id="perfil-titulo" className={styles.title}>
            Atualizar seus dados
          </h2>
          <p className={styles.subtitle}>
            Mantenha seus dados de contato em dia para receber as confirmações das reservas.
          </p>
        </div>
        <div className={styles.status}>
          <span className={styles.statusLabel}>Status do cadastro</span>
          <StatusTag kind="cliente" status={cliente.status} />
        </div>
      </div>

      <hr className={clsx('hr', styles.divider)} />

      <FormProvider {...methods}>
        <form className={styles.form} onSubmit={salvar} noValidate aria-labelledby="perfil-titulo">
          <ClienteFields senha="opcional" idPrefix="perfil" />
          <div className={styles.actions}>
            {isDirty && (
              <Button variant="ghost" size="lg" onClick={() => reset()} disabled={isSubmitting}>
                Descartar alterações
              </Button>
            )}
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </FormProvider>

      <p className={styles.note}>
        RF02 — os dados são validados novamente no servidor: o CPF (RN01) e o e-mail (RN02) não
        podem estar em uso por outro cadastro.
      </p>
    </Card>
  );
}
