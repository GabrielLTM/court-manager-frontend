import type { Field } from '@/shared/ui/editor';
export const CLIENT_FIELDS: Field[] = [
  { key: 'nome', label: 'Nome completo', autocomplete: 'name' },
  { key: 'cpf', label: 'CPF' },
  { key: 'dataNascimento', label: 'Data de nascimento', type: 'date', autocomplete: 'bday' },
  { key: 'telefone', label: 'Telefone', type: 'tel', autocomplete: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email', autocomplete: 'email' },
  { key: 'senha', label: 'Senha', type: 'password', autocomplete: 'new-password' },
];
export const emptyClient = () => ({
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  senha: '',
  status: '1',
});
