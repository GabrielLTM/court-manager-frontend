import { Controller, useFormContext } from 'react-hook-form';
import { Field } from '@/presentation/components/ui/Field';
import { Input, Select } from '@/presentation/components/ui/Input';
import { toISODate } from '@/shared/lib/date';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
import styles from './ClienteFields.module.css';

/** Formato mínimo esperado do formulário que envolve estes campos (via <FormProvider>). */
export interface ClienteFieldsValues {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  senha?: string;
  status?: '1' | '2';
}

export interface ClienteFieldsProps {
  /** Prefixo dos ids dos inputs (evita colisões quando há mais de um formulário na tela). */
  idPrefix?: string;
  senha?: 'obrigatoria' | 'opcional' | 'oculta';
  incluirEmail?: boolean;
  incluirStatus?: boolean;
}

/**
 * Campos de cadastro do cliente (Nome, CPF, Data de nascimento, Telefone, E-mail, Senha, Status),
 * com máscaras de CPF/telefone. Deve ser renderizado dentro de um <FormProvider> do react-hook-form.
 */
export function ClienteFields({
  idPrefix = 'cliente',
  senha = 'oculta',
  incluirEmail = true,
  incluirStatus = false,
}: ClienteFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ClienteFieldsValues>();
  const id = (campo: string) => `${idPrefix}-${campo}`;

  return (
    <div className={styles.grid}>
      <Field label="Nome completo" htmlFor={id('nome')} error={errors.nome?.message}>
        <Input
          id={id('nome')}
          placeholder="Isadora Oliveira"
          autoComplete="name"
          invalid={!!errors.nome}
          {...register('nome')}
        />
      </Field>

      <div className={styles.row}>
        <Field label="CPF" htmlFor={id('cpf')} error={errors.cpf?.message}>
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={id('cpf')}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(maskCpf(event.target.value))}
                inputMode="numeric"
                placeholder="000.000.000-00"
                autoComplete="off"
                invalid={!!errors.cpf}
              />
            )}
          />
        </Field>
        <Field label="Data de nascimento" htmlFor={id('dataNascimento')} error={errors.dataNascimento?.message}>
          <Input
            id={id('dataNascimento')}
            type="date"
            max={toISODate(new Date())}
            invalid={!!errors.dataNascimento}
            {...register('dataNascimento')}
          />
        </Field>
      </div>

      <Field label="Telefone" htmlFor={id('telefone')} error={errors.telefone?.message}>
        <Controller
          name="telefone"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={id('telefone')}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(maskTelefone(event.target.value))}
              inputMode="tel"
              placeholder="(51) 90000-0000"
              autoComplete="tel"
              invalid={!!errors.telefone}
            />
          )}
        />
      </Field>

      {incluirEmail && (
        <Field label="E-mail" htmlFor={id('email')} error={errors.email?.message}>
          <Input
            id={id('email')}
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
      )}

      {senha !== 'oculta' && (
        <Field
          label={senha === 'obrigatoria' ? 'Senha' : 'Nova senha'}
          htmlFor={id('senha')}
          error={errors.senha?.message}
          hint={senha === 'opcional' ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'}
        >
          <Input
            id={id('senha')}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            invalid={!!errors.senha}
            {...register('senha')}
          />
        </Field>
      )}

      {incluirStatus && (
        <Field label="Status do cadastro" htmlFor={id('status')} error={errors.status?.message}>
          <Select id={id('status')} {...register('status')}>
            <option value="1">Ativo</option>
            <option value="2">Inativo</option>
          </Select>
        </Field>
      )}
    </div>
  );
}
