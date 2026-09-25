import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';
import { DataTable } from '../DataTable';
import { Dialog } from '../Dialog';
import { Pill } from '../Pill';
import { describeStatus } from '../status';

describe('describeStatus', () => {
  it('usa verde para estados positivos, laranja para atenção e neutro para encerrados', () => {
    expect(describeStatus({ kind: 'reserva', status: StatusReserva.Confirmada })).toEqual({
      label: 'Confirmada',
      tone: 'accent-2',
    });
    expect(describeStatus({ kind: 'quadra', status: StatusQuadra.Manutencao })).toEqual({
      label: 'Manutenção',
      tone: 'accent',
    });
    expect(describeStatus({ kind: 'pagamento', status: StatusPagamento.Estornado }).tone).toBe('neutral');
  });

  it('trata pagamento inexistente como pendente', () => {
    expect(describeStatus({ kind: 'pagamento', status: null })).toEqual({ label: 'Pendente', tone: 'accent' });
  });
});

describe('Pill', () => {
  it('reflete o estado ativo em aria-pressed', () => {
    render(<Pill active>1 hora</Pill>);
    expect(screen.getByRole('button', { name: '1 hora' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('DataTable', () => {
  it('exibe a mensagem de vazio quando não há linhas', () => {
    render(
      <DataTable
        columns={[{ key: 'nome', header: 'Nome', render: (r: { nome: string }) => r.nome }]}
        rows={[]}
        getRowKey={(r) => r.nome}
        emptyMessage="Sem clientes"
      />,
    );
    expect(screen.getByText('Sem clientes')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('renderiza título/ações e fecha com Esc', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Cancelar reserva?" onClose={onClose} actions={<button>Manter</button>}>
        corpo
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Cancelar reserva?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manter' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha ao clicar no fundo', () => {
    const onClose = vi.fn();
    render(<Dialog open title="Detalhe" onClose={onClose} />);
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('não renderiza nada fechado', () => {
    render(<Dialog open={false} title="Oculto" onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
