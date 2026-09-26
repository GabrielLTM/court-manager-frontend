import { screen, within } from '@testing-library/react';
import type { ResumoDashboard } from '@/application/dto';
import { QUADRAS_PROTOTIPO, umaReserva } from '../../__tests__/fixtures';
import { renderizarAdmin } from '../../__tests__/renderizarAdmin';
import DashboardPage from '../DashboardPage';

const RESUMO: ResumoDashboard = {
  data: '2026-09-20',
  clientesAtivos: 11,
  totalQuadras: 6,
  quadrasAtivas: 4,
  reservasNoDia: 6,
  valorRecebidoNoDia: 562.5,
  reservasRecentes: [
    umaReserva({ id: 1056, data: '2026-09-23' }),
    // Confirmada que já terminou (08:00–09:00, "agora" = 10:00) aparece como Concluída.
    umaReserva({ id: 1042, horaInicio: '08:00', horaFim: '09:00', cliente: { id: 2, nome: 'Gabriel Lessa' } }),
  ],
  ocupacao: [
    { quadra: QUADRAS_PROTOTIPO[0], minutosReservados: 120, percentual: (120 / 840) * 100 },
    { quadra: QUADRAS_PROTOTIPO[1], minutosReservados: 0, percentual: 0 },
  ],
};

describe('DashboardPage', () => {
  it('exibe os indicadores, as reservas recentes e a ocupação do dia', async () => {
    const obterResumo = vi.fn(async () => RESUMO);
    renderizarAdmin(<DashboardPage />, { dashboard: { obterResumo } });

    expect(await screen.findByText('Reservas em 20/09')).toBeInTheDocument();
    expect(obterResumo).toHaveBeenCalledWith('2026-09-20');
    const indicadores = screen.getByRole('region', { name: 'Indicadores do dia' });
    expect(indicadores).toHaveTextContent('Clientes11ativos no cadastro');
    expect(indicadores).toHaveTextContent('Quadras64 ativas');
    expect(indicadores).toHaveTextContent('PagamentosR$ 562,50recebidos no dia');

    const recentes = screen.getByRole('region', { name: 'Reservas recentes' });
    const [, primeira, segunda] = within(recentes).getAllByRole('row');
    expect(primeira).toHaveTextContent('Isadora OliveiraQuadra 0123/09 · 19:00Confirmada');
    expect(segunda).toHaveTextContent('Gabriel LessaQuadra 0120/09 · 08:00Concluída');

    const ocupacao = screen.getByRole('region', { name: 'Ocupação por quadra — hoje' });
    expect(within(ocupacao).getByText('14%')).toBeInTheDocument();
    expect(within(ocupacao).getByRole('progressbar', { name: 'Ocupação da Quadra 01' })).toHaveAttribute(
      'aria-valuenow',
      '14',
    );
    expect(within(ocupacao).getByText('0%')).toBeInTheDocument();
  });
});
