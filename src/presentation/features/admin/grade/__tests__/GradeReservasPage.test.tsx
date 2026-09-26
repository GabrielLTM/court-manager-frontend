import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AlterarReservaInput } from '@/application/dto';
import type { Disponibilidade } from '@/domain/entities';
import { StatusPagamento, StatusReserva } from '@/domain/enums';
import { QUADRAS_PROTOTIPO, umPagamento, umaReserva } from '../../__tests__/fixtures';
import { renderizarAdmin } from '../../__tests__/renderizarAdmin';
import GradeReservasPage from '../GradeReservasPage';

const RESERVA_ISADORA = umaReserva(); // RSV-1041 · Quadra 01 · 19:00–20:00 · Pix · Pago
const RESERVA_ALEXANDRE = umaReserva({
  id: 1044,
  clienteId: 3,
  horaInicio: '15:00',
  horaFim: '16:00',
  cliente: { id: 3, nome: 'Alexandre De Ávila' },
  pagamento: umPagamento({ id: 4, reservaId: 1044, status: StatusPagamento.Pendente }),
});

function criarServicos() {
  const consultarDisponibilidade = vi.fn(
    async (quadraId: number, data: string): Promise<Disponibilidade> => ({
      quadraId,
      data,
      abertura: '07:00',
      fechamento: '22:00',
      ocupados:
        quadraId === 1
          ? [
              { inicio: '15:00', fim: '16:00' },
              { inicio: '19:00', fim: '20:00' },
            ]
          : [],
    }),
  );
  const cancelar = vi.fn(async (id: number) => ({ ...RESERVA_ISADORA, id, status: StatusReserva.Cancelada }));
  const alterar = vi.fn(async (id: number, input: AlterarReservaInput) => ({
    ...RESERVA_ISADORA,
    id,
    quadraId: input.quadraId,
    data: input.data,
    horaInicio: input.horaInicio,
  }));
  const servicos = {
    quadras: { listar: vi.fn(async () => QUADRAS_PROTOTIPO.slice(0, 3)), consultarDisponibilidade },
    reservas: { listar: vi.fn(async () => [RESERVA_ALEXANDRE, RESERVA_ISADORA]), cancelar, alterar },
  };
  return { servicos, cancelar, alterar };
}

describe('GradeReservasPage', () => {
  it('monta a grade da data e informa horários livres e quadras indisponíveis', async () => {
    const user = userEvent.setup();
    const { servicos } = criarServicos();
    renderizarAdmin(<GradeReservasPage />, servicos);

    const grade = await screen.findByRole('table', { name: 'Grade de reservas de 20/09/2026' });
    expect(within(grade).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Horário',
      'Quadra 01',
      'Quadra 02',
      'Quadra 03',
    ]);
    await waitFor(() => expect(grade).not.toHaveAttribute('aria-busy'));
    expect(within(grade).getByRole('button', { name: 'Quadra 01 às 19:00 — Isadora Oliveira, pago' })).toHaveTextContent(
      'Isadora',
    );
    expect(
      within(grade).getByRole('button', { name: 'Quadra 01 às 15:00 — Alexandre De Ávila, pagamento pendente' }),
    ).toHaveTextContent('Alexandre');
    expect(screen.getByText(/Exibindo dom, 20\/09\/2026 · 2 reservas/)).toBeInTheDocument();

    await user.click(within(grade).getByRole('button', { name: 'Quadra 03 às 19:00 — livre' }));
    expect(await screen.findByText('Livre — Quadra 03 às 19:00')).toBeInTheDocument();

    await user.click(within(grade).getByRole('button', { name: 'Quadra 02 às 07:00 — manutenção' }));
    expect(await screen.findByText('Quadra 02 — manutenção')).toBeInTheDocument();
  });

  it('abre o detalhe e cancela a reserva após a confirmação', async () => {
    const user = userEvent.setup();
    const { servicos, cancelar } = criarServicos();
    renderizarAdmin(<GradeReservasPage />, servicos);

    await user.click(await screen.findByRole('button', { name: /Quadra 01 às 19:00 — Isadora/ }));
    const dialogo = await screen.findByRole('dialog', { name: 'RSV-1041' });
    for (const texto of ['Isadora Oliveira', 'Quadra 01', '20/09 · 19:00–20:00', 'R$ 80,00', 'Pix · Pago', 'Confirmada']) {
      expect(within(dialogo).getByText(texto)).toBeInTheDocument();
    }

    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));
    expect(within(dialogo).getByRole('alert')).toHaveTextContent(
      'Confirma o cancelamento desta reserva? O pagamento será estornado.',
    );
    expect(within(dialogo).queryByRole('button', { name: 'Alterar' })).not.toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(cancelar).toHaveBeenCalledWith(1041);
    expect(await screen.findByText('Reserva RSV-1041 cancelada — horário liberado')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('"Manter" volta ao detalhe sem cancelar', async () => {
    const user = userEvent.setup();
    const { servicos, cancelar } = criarServicos();
    renderizarAdmin(<GradeReservasPage />, servicos);

    await user.click(await screen.findByRole('button', { name: /Quadra 01 às 15:00 — Alexandre/ }));
    const dialogo = await screen.findByRole('dialog', { name: 'RSV-1044' });
    expect(within(dialogo).getByText('Pix · Pendente')).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));
    expect(within(dialogo).getByRole('alert')).toHaveTextContent('O pagamento será cancelado.');
    const manter = within(dialogo).getByRole('button', { name: 'Manter' });
    expect(manter).toHaveFocus();
    await user.click(manter);

    expect(within(dialogo).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Alterar' })).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Cancelar reserva' })).toHaveFocus();
    expect(cancelar).not.toHaveBeenCalled();
  });

  it('altera o horário da reserva (RF13) exibindo o horário atual como livre', async () => {
    const user = userEvent.setup();
    const { servicos, alterar } = criarServicos();
    renderizarAdmin(<GradeReservasPage />, servicos);

    await user.click(await screen.findByRole('button', { name: /Quadra 01 às 19:00 — Isadora/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Alterar' }));

    const dialogo = await screen.findByRole('dialog', { name: 'Alterar reserva RSV-1041' });
    expect(within(dialogo).getByLabelText('Quadra')).toHaveValue('1');
    expect(within(dialogo).getByLabelText('Data')).toHaveValue('2026-09-20');
    expect(within(dialogo).getByRole('button', { name: '1 hora' })).toHaveAttribute('aria-pressed', 'true');

    const atual = await within(dialogo).findByRole('button', { name: '19:00' });
    expect(atual).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialogo).getByRole('button', { name: '15:00' })).toHaveAttribute('aria-disabled', 'true');
    const salvar = within(dialogo).getByRole('button', { name: 'Salvar alteração' });
    expect(salvar).toBeDisabled();

    await user.click(within(dialogo).getByRole('button', { name: '20:00' }));
    expect(within(dialogo).getByText('Quadra 01 · 20/09 · 20:00–21:00 · R$ 80,00')).toBeInTheDocument();
    await user.click(salvar);

    expect(alterar).toHaveBeenCalledWith(1041, {
      quadraId: 1,
      data: '2026-09-20',
      horaInicio: '20:00',
      duracaoMinutos: 60,
    });
    expect(await screen.findByText('Reserva RSV-1041 alterada')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
