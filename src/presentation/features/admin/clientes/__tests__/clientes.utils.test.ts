import { StatusCliente } from '@/domain/enums';
import { umCliente } from '../../__tests__/fixtures';
import {
  clienteCorrespondeBusca,
  clienteParaForm,
  contarReservasPorCliente,
  filtrarClientes,
  formParaAtualizarCliente,
  formParaNovoCliente,
  mensagemStatusCliente,
} from '../clientes.utils';

const CLIENTES = [
  umCliente(),
  umCliente({ id: 3, nome: 'Alexandre De Ávila', cpf: '456.789.123-64', email: 'alexandre@email.com' }),
  umCliente({
    id: 5,
    nome: 'Marina Duarte',
    cpf: '159.753.486-25',
    email: 'marina@email.com',
    status: StatusCliente.Inativo,
  }),
];

describe('clienteCorrespondeBusca', () => {
  const alexandre = CLIENTES[1];

  it('ignora acentos e maiúsculas no nome', () => {
    expect(clienteCorrespondeBusca(alexandre, 'avila')).toBe(true);
    expect(clienteCorrespondeBusca(alexandre, 'ÁVILA')).toBe(true);
    expect(clienteCorrespondeBusca(alexandre, 'alex de')).toBe(true);
  });

  it('exige todas as palavras do termo', () => {
    expect(clienteCorrespondeBusca(CLIENTES[0], 'isa oli')).toBe(true);
    expect(clienteCorrespondeBusca(CLIENTES[0], 'isa duarte')).toBe(false);
  });

  it('busca por e-mail', () => {
    expect(clienteCorrespondeBusca(alexandre, 'alexandre@')).toBe(true);
  });

  it('busca pelos dígitos do CPF, com ou sem máscara', () => {
    expect(clienteCorrespondeBusca(alexandre, '45678912364')).toBe(true);
    expect(clienteCorrespondeBusca(alexandre, '456.789')).toBe(true);
    expect(clienteCorrespondeBusca(alexandre, '789.123-6')).toBe(true);
    expect(clienteCorrespondeBusca(alexandre, '999')).toBe(false);
  });

  it('termo vazio corresponde a todos', () => {
    expect(clienteCorrespondeBusca(alexandre, '   ')).toBe(true);
  });
});

describe('filtrarClientes', () => {
  it('combina busca e status', () => {
    expect(filtrarClientes(CLIENTES, { busca: '', status: 'todos' })).toHaveLength(3);
    expect(filtrarClientes(CLIENTES, { busca: '', status: 'ativos' }).map((c) => c.id)).toEqual([1, 3]);
    expect(filtrarClientes(CLIENTES, { busca: '', status: 'inativos' }).map((c) => c.id)).toEqual([5]);
    expect(filtrarClientes(CLIENTES, { busca: 'marina', status: 'ativos' })).toEqual([]);
    expect(filtrarClientes(CLIENTES, { busca: 'email.com', status: 'todos' })).toHaveLength(3);
  });
});

describe('contarReservasPorCliente', () => {
  it('agrupa as reservas pelo cliente', () => {
    const contagem = contarReservasPorCliente([{ clienteId: 1 }, { clienteId: 2 }, { clienteId: 1 }]);
    expect(contagem.get(1)).toBe(2);
    expect(contagem.get(2)).toBe(1);
    expect(contagem.get(3)).toBeUndefined();
  });
});

describe('mensagemStatusCliente', () => {
  it('informa a reativação ou inativação do cadastro', () => {
    expect(mensagemStatusCliente('Marina Duarte', StatusCliente.Ativo)).toBe('Marina Duarte — cadastro reativado');
    expect(mensagemStatusCliente('Gabriel Lessa', StatusCliente.Inativo)).toBe('Gabriel Lessa — cadastro inativado');
  });
});

describe('formulário de cliente', () => {
  it('preenche valores iniciais para cadastro e edição', () => {
    expect(clienteParaForm(null)).toEqual({
      nome: '',
      cpf: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      senha: '',
      status: '1',
    });
    expect(clienteParaForm(umCliente({ dataNascimento: null, status: StatusCliente.Inativo }))).toMatchObject({
      nome: 'Isadora Oliveira',
      dataNascimento: '',
      senha: '',
      status: '2',
    });
  });

  const valores = {
    nome: 'Bruna Carvalho',
    cpf: '274.185.963-91',
    dataNascimento: '1995-04-12',
    telefone: '(51) 99456-7812',
    email: 'bruna@email.com',
    senha: 'segredo1',
    status: '1' as const,
  };

  it('monta o DTO de criação com senha e status numérico', () => {
    expect(formParaNovoCliente(valores)).toEqual({
      nome: 'Bruna Carvalho',
      cpf: '274.185.963-91',
      dataNascimento: '1995-04-12',
      telefone: '(51) 99456-7812',
      email: 'bruna@email.com',
      senha: 'segredo1',
      status: StatusCliente.Ativo,
    });
  });

  it('omite a senha vazia na edição (mantém a atual)', () => {
    const semSenha = formParaAtualizarCliente({ ...valores, senha: '', status: '2' });
    expect(semSenha).not.toHaveProperty('senha');
    expect(semSenha.status).toBe(StatusCliente.Inativo);
    expect(formParaAtualizarCliente(valores).senha).toBe('segredo1');
  });

  it('envia data de nascimento vazia como null', () => {
    expect(formParaNovoCliente({ ...valores, dataNascimento: '' }).dataNascimento).toBeNull();
  });
});
