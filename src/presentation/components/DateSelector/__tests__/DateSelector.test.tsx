import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DateSelector } from '../DateSelector';

function Harness({ inicial = '2026-09-20' }: { inicial?: string }) {
  const [data, setData] = useState(inicial);
  return (
    <>
      <DateSelector value={data} onChange={setData} inicio="2026-09-20" min="2026-09-20" max="2026-10-19" />
      <output>{data}</output>
    </>
  );
}

describe('DateSelector', () => {
  it('mostra 7 dias a partir do início e seleciona um dia da faixa', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: '20/09/2026' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '26/09/2026' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '27/09/2026' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '22/09/2026' }));
    expect(screen.getByText('2026-09-22')).toBeInTheDocument();
  });

  it('abre o calendário, respeita os limites e navega entre meses', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Mais datas' }));
    const calendario = screen.getByRole('dialog', { name: 'Calendário' });
    expect(calendario).toHaveTextContent('Setembro 2026');
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '19/09/2026' }).at(-1)).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(calendario).toHaveTextContent('Outubro 2026');
    expect(screen.getByRole('button', { name: '20/10/2026' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: '15/10/2026' }));
    expect(screen.getByText('2026-10-15')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Calendário' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mais datas' })).toHaveAttribute('aria-pressed', 'true');
  });
});
