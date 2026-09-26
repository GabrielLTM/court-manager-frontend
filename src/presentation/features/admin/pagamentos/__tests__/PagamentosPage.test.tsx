import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetodoPagamento, StatusPagamento, StatusReserva } from '@/domain/enums';
import { formatDataHora } from '@/shared/lib/date';
import { umPagamentoDetalhado, umaQuadra, umaReserva } from '../../__tests__/fixtures';
import { renderizarAdmin } from '../../__tests__/renderizarAdmin';
import PagamentosPage from '../PagamentosPage';

const PAGO = umPagamentoDetalhado(); // RSV-1041 · Pix · Pago · R$ 80,00
const PENDENTE = umPagamentoDetalhado({
  id: 4,
  reservaId: 1044,
  metodo: MetodoPagamento.Dinheiro,
  status: StatusPagamento.Pendente,
  dataPagamento: null,
  reserva: umaReserva({ id: 1044, horaInicio: '10:00', horaFim: '11:00' }),
  cliente: { id: 3, nome: 'Alexandre De Ávila' },
});
const ESTORNADO = umPagamentoDetalhado({
  id: 15,
  reservaId: 1055,
  valor: 90,
  status: StatusPagamento.Estornado,
  reserva: umaReserva({ id: 1055, quadraId: 3, status: StatusReserva.Cancelada }),
  quadra: umaQuadra({ id: 3, nome: 'Quadra 03', valorHora: 90 }),
});

function criarServicos() {
  const confirmar = vi.fn(async (id: number) => ({ ...PENDENTE, id, status: StatusPagamento.Pago }));
  const servicos = { pagamentos: { listar: vi.fn(async () => [PAGO, PENDENTE, ESTORNADO]), confirmar } };
  return { servicos, confirmar };
}

describe('PagamentosPage', () => {
  it('resume os valores e filtra por status', async () => {
    const user = userEvent.setup();
    const { servicos } = criarServicos();
    renderizarAdmin(<PagamentosPage />, servicos);

    const resumo = await screen.findByRole('region', { name: 'Resumo dos pagamentos' });
    expect(resumo).toHaveTextContent('RecebidoR$ 80,001 pagamento');
    expect(resumo).toHaveTextContent('A receberR$ 80,001 pagamento');
    expect(resumo).toHaveTextContent('EstornadoR$ 90,001 pagamento');
    expect(screen.getAllByRole('row')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Pendentes' }));
    const linhas = screen.getAllByRole('row');
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toHaveTextContent('RSV-1044');

    await user.click(screen.getByRole('button', { name: 'Cancelados' }));
    expect(screen.getByText('Nenhum pagamento com este status.')).toBeInTheDocument();
  });

  it('confirma o recebimento de um pagamento pendente (RF16)', async () => {
    const user = userEvent.setup();
    const { servicos, confirmar } = criarServicos();
    renderizarAdmin(<PagamentosPage />, servicos);

    await user.click(await screen.findByRole('button', { name: 'Confirmar pagamento RSV-1044' }));
    expect(confirmar).toHaveBeenCalledWith(4);
    expect(await screen.findByText('Pagamento RSV-1044 confirmado')).toBeInTheDocument();
  });

  it('exibe o recibo do pagamento', async () => {
    const user = userEvent.setup();
    const { servicos } = criarServicos();
    renderizarAdmin(<PagamentosPage />, servicos);

    await user.click(await screen.findByRole('button', { name: 'Recibo RSV-1041' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Recibo RSV-1041' });
    for (const texto of ['Isadora Oliveira', 'Quadra 01', '20/09/2026 · 19:00–20:00', 'Pix', 'Pago', 'R$ 80,00']) {
      expect(within(dialogo).getByText(texto)).toBeInTheDocument();
    }
    expect(within(dialogo).getByText('Pago em')).toBeInTheDocument();
    expect(within(dialogo).getByText(formatDataHora(PAGO.dataPagamento ?? ''))).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
