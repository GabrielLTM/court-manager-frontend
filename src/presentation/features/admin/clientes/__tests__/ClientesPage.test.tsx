import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AtualizarClienteInput, NovoClienteInput } from '@/application/dto';
import { StatusCliente } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { umCliente, umaReserva } from '../../__tests__/fixtures';
import { renderizarAdmin } from '../../__tests__/renderizarAdmin';
import ClientesPage from '../ClientesPage';

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
  ...Array.from({ length: 7 }, (_, i) =>
    umCliente({ id: 20 + i, nome: `Cliente Extra ${i + 1}`, email: `extra${i + 1}@email.com`, cpf: '000.000.000-00' }),
  ),
];

function criarServicos() {
  const alterarStatus = vi.fn(async (id: number, status: StatusCliente) => ({ ...CLIENTES[2], id, status }));
  const criar = vi.fn(async (input: NovoClienteInput) => ({ id: 99, ...input }));
  const atualizar = vi.fn(async (id: number, input: AtualizarClienteInput) => ({ id, ...input }));
  const servicos = {
    clientes: { listar: vi.fn(async () => CLIENTES), alterarStatus, criar, atualizar },
    reservas: { listar: vi.fn(async () => [umaReserva(), umaReserva({ id: 1043 }), umaReserva({ id: 1044, clienteId: 3 })]) },
  };
  return { servicos, alterarStatus, criar, atualizar };
}

describe('ClientesPage', () => {
  it('lista, pagina e filtra clientes por busca e status', async () => {
    const user = userEvent.setup();
    const { servicos } = criarServicos();
    renderizarAdmin(<ClientesPage />, servicos);

    const isadora = await screen.findByRole('row', { name: /Isadora Oliveira/ });
    expect(await within(isadora).findByRole('cell', { name: '2' })).toBeInTheDocument();
    expect(within(isadora).getByText('012.345.678-90')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2 · 10 registros')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Próxima ›' }));
    expect(screen.getByText('Página 2 de 2 · 10 registros')).toBeInTheDocument();

    const busca = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await user.type(busca, 'avila');
    expect(screen.getByText('Alexandre De Ávila')).toBeInTheDocument();
    expect(screen.queryByText('Isadora Oliveira')).not.toBeInTheDocument();
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();

    await user.clear(busca);
    await user.type(busca, '159.753');
    expect(screen.getByText('Marina Duarte')).toBeInTheDocument();

    await user.clear(busca);
    await user.click(screen.getByRole('button', { name: 'Inativos' }));
    expect(screen.getAllByRole('row')).toHaveLength(2); // cabeçalho + Marina
    expect(screen.getByRole('button', { name: 'Inativos' })).toHaveAttribute('aria-pressed', 'true');

    await user.type(busca, 'isadora');
    expect(screen.getByText('Nenhum cliente encontrado para os filtros.')).toBeInTheDocument();
  });

  it('reativa e inativa clientes, exibindo erros de RN01 (RF04)', async () => {
    const user = userEvent.setup();
    const { servicos, alterarStatus } = criarServicos();
    alterarStatus.mockRejectedValueOnce(new DomainError('RN01', 'RN01 — já existe um cliente ativo com este CPF.'));
    renderizarAdmin(<ClientesPage />, servicos);

    await user.click(await screen.findByRole('button', { name: 'Reativar Marina Duarte' }));
    expect(alterarStatus).toHaveBeenCalledWith(5, StatusCliente.Ativo);
    expect(await screen.findByText('RN01 — já existe um cliente ativo com este CPF.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Inativar Isadora Oliveira' }));
    expect(alterarStatus).toHaveBeenLastCalledWith(1, StatusCliente.Inativo);
    expect(await screen.findByText('Isadora Oliveira — cadastro inativado')).toBeInTheDocument();
  });

  it('edita os dados mantendo a senha atual quando o campo fica vazio (RF02)', async () => {
    const user = userEvent.setup();
    const { servicos, atualizar } = criarServicos();
    renderizarAdmin(<ClientesPage />, servicos);

    await user.click(await screen.findByRole('button', { name: 'Editar Isadora Oliveira' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Editar cliente' });
    const nome = within(dialogo).getByLabelText('Nome completo');
    expect(nome).toHaveValue('Isadora Oliveira');
    expect(within(dialogo).getByLabelText('Status do cadastro')).toHaveValue('1');

    await user.clear(nome);
    await user.type(nome, 'Isadora Lima');
    await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }));

    expect(atualizar).toHaveBeenCalledWith(1, {
      nome: 'Isadora Lima',
      cpf: '012.345.678-90',
      telefone: '(51) 99812-4477',
      email: 'isadora@email.com',
      dataNascimento: '1998-03-14',
      status: StatusCliente.Ativo,
    });
    expect(await screen.findByText('Dados de Isadora Lima atualizados')).toBeInTheDocument();
  });

  it('cadastra um novo cliente com senha obrigatória (RF01)', async () => {
    const user = userEvent.setup();
    const { servicos, criar } = criarServicos();
    renderizarAdmin(<ClientesPage />, servicos);

    await user.click(await screen.findByRole('button', { name: '+ Novo cliente' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Novo cliente' });
    await user.type(within(dialogo).getByLabelText('Nome completo'), 'Bruna Carvalho');
    await user.type(within(dialogo).getByLabelText('CPF'), '27418596391');
    await user.type(within(dialogo).getByLabelText('Data de nascimento'), '1995-04-12');
    await user.type(within(dialogo).getByLabelText('Telefone'), '51994567812');
    await user.type(within(dialogo).getByLabelText('E-mail'), 'bruna@email.com');
    await user.click(within(dialogo).getByRole('button', { name: 'Cadastrar cliente' }));
    expect(await within(dialogo).findByText('A senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument();

    await user.type(within(dialogo).getByLabelText('Senha'), 'segredo1');
    await user.click(within(dialogo).getByRole('button', { name: 'Cadastrar cliente' }));
    expect(criar).toHaveBeenCalledWith({
      nome: 'Bruna Carvalho',
      cpf: '274.185.963-91',
      telefone: '(51) 99456-7812',
      email: 'bruna@email.com',
      dataNascimento: '1995-04-12',
      senha: 'segredo1',
      status: StatusCliente.Ativo,
    });
    expect(await screen.findByText('Cliente cadastrado')).toBeInTheDocument();
  });
});
