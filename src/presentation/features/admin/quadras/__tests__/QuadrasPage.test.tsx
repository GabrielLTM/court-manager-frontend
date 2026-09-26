import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { QuadraInput } from '@/application/dto';
import type { StatusQuadra } from '@/domain/enums';
import { StatusQuadra as Status } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { QUADRAS_PROTOTIPO } from '../../__tests__/fixtures';
import { renderizarAdmin } from '../../__tests__/renderizarAdmin';
import QuadrasPage from '../QuadrasPage';

function criarServicos() {
  const alterarStatus = vi.fn(async (id: number, status: StatusQuadra) => ({ ...QUADRAS_PROTOTIPO[0], id, status }));
  const criar = vi.fn(async (input: QuadraInput) => ({ id: 7, ...input }));
  const atualizar = vi.fn(async (id: number, input: QuadraInput) => ({ id, ...input }));
  const servicos = { quadras: { listar: vi.fn(async () => QUADRAS_PROTOTIPO), alterarStatus, criar, atualizar } };
  return { servicos, alterarStatus, criar, atualizar };
}

describe('QuadrasPage', () => {
  it('lista as quadras e altera o status pelo cartão (RF07)', async () => {
    const user = userEvent.setup();
    const { servicos, alterarStatus } = criarServicos();
    renderizarAdmin(<QuadrasPage />, servicos);

    const cartao = await screen.findByRole('article', { name: 'Quadra 01' });
    expect(within(cartao).getByText('Ativa')).toBeInTheDocument();
    expect(within(cartao).getByText('Beach Tennis')).toBeInTheDocument();
    expect(cartao).toHaveTextContent('R$ 80,00/hora');
    expect(within(cartao).getByRole('button', { name: 'Ativar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('article')).toHaveLength(6);

    await user.click(within(cartao).getByRole('button', { name: 'Ativar' }));
    expect(alterarStatus).not.toHaveBeenCalled();

    await user.click(within(cartao).getByRole('button', { name: 'Manutenção' }));
    expect(alterarStatus).toHaveBeenCalledWith(1, Status.Manutencao);
    expect(await screen.findByText('Quadra 01 — em manutenção')).toBeInTheDocument();
  });

  it('valida e cadastra uma nova quadra (RF05)', async () => {
    const user = userEvent.setup();
    const { servicos, criar } = criarServicos();
    renderizarAdmin(<QuadrasPage />, servicos);
    await screen.findAllByRole('article');

    await user.click(screen.getByRole('button', { name: '+ Nova quadra' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Nova quadra' });
    expect(within(dialogo).getByLabelText('Identificação')).toHaveAttribute('placeholder', 'Quadra 07');

    await user.click(within(dialogo).getByRole('button', { name: 'Cadastrar quadra' }));
    expect(await within(dialogo).findByText('Informe a identificação da quadra.')).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();

    await user.type(within(dialogo).getByLabelText('Identificação'), 'Quadra 07');
    await user.type(within(dialogo).getByLabelText('Tipo'), 'Futevôlei');
    await user.type(within(dialogo).getByLabelText('Valor por hora (R$)'), '75,50');
    await user.selectOptions(within(dialogo).getByLabelText('Status'), 'Manutenção');
    await user.click(within(dialogo).getByRole('button', { name: 'Cadastrar quadra' }));

    expect(criar).toHaveBeenCalledWith({
      nome: 'Quadra 07',
      tipo: 'Futevôlei',
      valorHora: 75.5,
      status: Status.Manutencao,
    });
    expect(await screen.findByText('Quadra 07 cadastrada')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('edita uma quadra e exibe erros da API sem fechar o formulário (RF06)', async () => {
    const user = userEvent.setup();
    const { servicos, atualizar } = criarServicos();
    atualizar.mockRejectedValueOnce(new DomainError('VALIDACAO', 'Já existe uma quadra com esta identificação.'));
    renderizarAdmin(<QuadrasPage />, servicos);

    await user.click(await screen.findByRole('button', { name: 'Editar Quadra 01' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Editar Quadra 01' });
    expect(within(dialogo).getByLabelText('Valor por hora (R$)')).toHaveValue('80,00');

    await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Já existe uma quadra com esta identificação.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Editar Quadra 01' })).toBeInTheDocument();

    const valor = within(dialogo).getByLabelText('Valor por hora (R$)');
    await user.clear(valor);
    await user.type(valor, '85');
    await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }));
    expect(atualizar).toHaveBeenLastCalledWith(1, {
      nome: 'Quadra 01',
      tipo: 'Beach Tennis',
      valorHora: 85,
      status: Status.Ativa,
    });
    expect(await screen.findByText('Quadra 01 atualizada')).toBeInTheDocument();
  });
});
