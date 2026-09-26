import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import type { Quadra } from '@/domain/entities';
import { STATUS_QUADRA_LABEL, STATUS_QUADRA_VALUES } from '@/domain/enums';
import { Button, Dialog, Field, Input, Select } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAtualizarQuadra, useCriarQuadra } from '@/presentation/queries';
import { quadraSchema, type QuadraFormValues } from '@/presentation/validation/schemas';
import { TIPOS_QUADRA, formParaQuadraInput, quadraParaForm } from '../quadras.utils';
import styles from './QuadraFormDialog.module.css';

export interface QuadraFormDialogProps {
  /** Quadra em edição; `null` para cadastrar uma nova. */
  quadra: Quadra | null;
  /** Placeholder da identificação (ex.: "Quadra 07"). */
  sugestaoNome: string;
  onClose: () => void;
}

/** Cadastro (RF05) e edição (RF06) de quadra. */
export function QuadraFormDialog({ quadra, sugestaoNome, onClose }: QuadraFormDialogProps) {
  const toast = useToast();
  const criar = useCriarQuadra();
  const atualizar = useAtualizarQuadra();
  const formId = useId();
  const tiposId = useId();
  const id = (campo: string) => `${formId}-${campo}`;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuadraFormValues>({
    resolver: zodResolver(quadraSchema),
    defaultValues: quadraParaForm(quadra),
  });

  const onSubmit = handleSubmit(async (values) => {
    const input = formParaQuadraInput(values);
    try {
      if (quadra) {
        const salva = await atualizar.mutateAsync({ id: quadra.id, input });
        toast.success(`${salva.nome} atualizada`);
      } else {
        const salva = await criar.mutateAsync(input);
        toast.success(`${salva.nome} cadastrada`);
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <Dialog
      open
      variant="form"
      title={quadra ? `Editar ${quadra.nome}` : 'Nova quadra'}
      onClose={onClose}
      closeOnBackdrop={false}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={isSubmitting}>
            {quadra ? 'Salvar alterações' : 'Cadastrar quadra'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={onSubmit} noValidate>
        <Field label="Identificação" htmlFor={id('nome')} error={errors.nome?.message}>
          <Input
            id={id('nome')}
            placeholder={sugestaoNome}
            autoComplete="off"
            invalid={!!errors.nome}
            {...register('nome')}
          />
        </Field>

        <Field label="Tipo" htmlFor={id('tipo')} error={errors.tipo?.message}>
          <Input
            id={id('tipo')}
            list={tiposId}
            placeholder="Beach Tennis"
            autoComplete="off"
            invalid={!!errors.tipo}
            {...register('tipo')}
          />
          <datalist id={tiposId}>
            {TIPOS_QUADRA.map((tipo) => (
              <option key={tipo} value={tipo} />
            ))}
          </datalist>
        </Field>

        <div className={styles.row}>
          <Field label="Valor por hora (R$)" htmlFor={id('valorHora')} error={errors.valorHora?.message}>
            <Input
              id={id('valorHora')}
              inputMode="decimal"
              placeholder="80,00"
              autoComplete="off"
              invalid={!!errors.valorHora}
              {...register('valorHora')}
            />
          </Field>
          <Field label="Status" htmlFor={id('status')} error={errors.status?.message}>
            <Select id={id('status')} invalid={!!errors.status} {...register('status')}>
              {STATUS_QUADRA_VALUES.map((status) => (
                <option key={status} value={String(status)}>
                  {STATUS_QUADRA_LABEL[status]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
