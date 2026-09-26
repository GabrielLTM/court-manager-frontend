import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { Cliente } from '@/domain/entities';
import { ClienteFields } from '@/presentation/components/forms/ClienteFields';
import { Button, Dialog } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { aplicarErrosDoServidor } from '@/presentation/lib/serverErrors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAtualizarCliente, useCriarCliente } from '@/presentation/queries';
import {
  clienteEdicaoSchema,
  clienteNovoSchema,
  type ClienteFormValues,
} from '@/presentation/validation/schemas';
import { clienteParaForm, formParaAtualizarCliente, formParaNovoCliente } from '../clientes.utils';

export interface ClienteFormDialogProps {
  /** Cliente em edição; `null` para cadastrar um novo. */
  cliente: Cliente | null;
  onClose: () => void;
}

/** Cadastro (RF01) e edição (RF02) de cliente pelo administrador. */
export function ClienteFormDialog({ cliente, onClose }: ClienteFormDialogProps) {
  const toast = useToast();
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const formId = useId();

  const methods = useForm<ClienteFormValues>({
    resolver: zodResolver(cliente ? clienteEdicaoSchema : clienteNovoSchema),
    defaultValues: clienteParaForm(cliente),
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      if (cliente) {
        const salvo = await atualizar.mutateAsync({ id: cliente.id, input: formParaAtualizarCliente(values) });
        toast.success(`Dados de ${salvo.nome} atualizados`);
      } else {
        await criar.mutateAsync(formParaNovoCliente(values));
        toast.success('Cliente cadastrado');
      }
      onClose();
    } catch (error) {
      // RN01/RN02 e fieldErrors da API aparecem junto ao campo; o toast resume o problema.
      aplicarErrosDoServidor(error, methods.setError, ['nome', 'cpf', 'dataNascimento', 'telefone', 'email', 'senha']);
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Dialog
      open
      size="lg"
      variant="form"
      title={cliente ? 'Editar cliente' : 'Novo cliente'}
      onClose={onClose}
      closeOnBackdrop={false}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={methods.formState.isSubmitting}>
            {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form id={formId} onSubmit={onSubmit} noValidate>
          <ClienteFields
            idPrefix="admin-cliente"
            senha={cliente ? 'opcional' : 'obrigatoria'}
            incluirStatus
          />
        </form>
      </FormProvider>
    </Dialog>
  );
}
