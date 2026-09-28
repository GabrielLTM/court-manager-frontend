import { QueryClient } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { NovaReservaInput } from '@/application/dto';
import type { AppServices } from '@/application/services';
import type { Disponibilidade, Quadra, Sessao } from '@/domain/entities';
import { MetodoPagamento, Perfil, StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { AppProviders } from '@/presentation/providers/AppProviders';
import { ROUTES } from '@/presentation/routes/paths';
import ReservarPage from '../ReservarPage';

const QUADRAS: Quadra[] = [
  { id: 1, nome: 'Quadra 01', tipo: 'Beach Tennis', valorHora: 80, status: StatusQuadra.Ativa },
  { id: 2, nome: 'Quadra 02', tipo: 'Beach Tennis', valorHora: 80, status: StatusQuadra.Manutencao },
  { id: 3, nome: 'Quadra 03', tipo: 'Beach Tennis', valorHora: 90, status: StatusQuadra.Ativa },
  { id: 6, nome: 'Quadra 06', tipo: 'Vôlei de praia', valorHora: 70, status: StatusQuadra.Inativa },
];

const SESSAO: Sessao = {
  token: 'token',
  usuario: { id: 7, nome: 'Isadora Oliveira', email: 'isadora@email.com', perfil: Perfil.Cliente, clienteId: 1 },
  expiraEm: null,
};

function criarServicos(criar: (input: NovaReservaInput) => Promise<unknown>) {
  const consultarDisponibilidade = vi.fn(
    async (quadraId: number, data: string): Promise<Disponibilidade> => ({
      quadraId,
      data,
      abertura: '07:00',
      fechamento: '22:00',
      ocupados: quadraId === 1 ? [{ inicio: '19:00', fim: '20:00' }] : [],
    }),
  );
  const servicos = {
    auth: { sessaoAtual: () => SESSAO, subscribe: () => () => {}, login: vi.fn(), registrar: vi.fn(), logout: vi.fn() },
    // "Agora": 20/09/2026 às 10:00 — horários até 10:00 já passaram.
    clock: { now: () => new Date(2026, 8, 20, 10, 0) },
    quadras: { listar: vi.fn(async () => QUADRAS), consultarDisponibilidade },
    reservas: { criar: vi.fn(criar) },
  };
  return { servicos, consultarDisponibilidade };
}

function renderizar(servicos: unknown) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return render(
    <AppProviders services={servicos as AppServices} queryClient={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.reservar]}>
        <Routes>
          <Route path={ROUTES.reservar} element={<ReservarPage />} />
          <Route path={ROUTES.minhasReservas} element={<p>Página Minhas reservas</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

const botaoResumo = () => screen.getByRole('button', { name: /^(Confirmar reserva|Selecione um horário)$/ });

describe('ReservarPage', () => {
  it('seleciona a primeira quadra ativa e explica quadras e horários indisponíveis', async () => {
    const user = userEvent.setup();
    const { servicos, consultarDisponibilidade } = criarServicos(vi.fn());
    renderizar(servicos);

    const quadra01 = await screen.findByRole('button', { name: /Quadra 01/ });
    expect(quadra01).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Quadra 01' })).toBeInTheDocument();
    expect(screen.getByText('Selecionada: 20/09/2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Quadra 02/ }));
    expect(await screen.findByText('Esta quadra está em manutenção no momento')).toBeInTheDocument();
    expect(quadra01).toHaveAttribute('aria-pressed', 'true');

    const ocupado = await screen.findByRole('button', { name: '19:00' });
    expect(ocupado).toHaveAttribute('aria-disabled', 'true');
    await user.click(ocupado);
    expect(await screen.findByText('Horário indisponível nesta quadra')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '09:00' }));
    expect(await screen.findByText('Este horário já passou')).toBeInTheDocument();

    expect(botaoResumo()).toHaveTextContent('Selecione um horário');
    expect(botaoResumo()).toBeDisabled();
    expect(consultarDisponibilidade).toHaveBeenCalledWith(1, '2026-09-20');
  });

  it('limpa o horário ao trocar a duração e atualiza o resumo', async () => {
    const user = userEvent.setup();
    const { servicos } = criarServicos(vi.fn());
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: '18:00' }));
    expect(screen.getByText('18:00–19:00')).toBeInTheDocument();
    expect(botaoResumo()).toHaveTextContent('Confirmar reserva');
    expect(botaoResumo()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '2 horas' }));
    expect(botaoResumo()).toHaveTextContent('Selecione um horário');
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.getByText('R$ 160,00')).toBeInTheDocument();
    // 18:00–20:00 conflita com a reserva das 19:00 (RN04).
    expect(screen.getByRole('button', { name: '18:00' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('confirma a reserva com o método escolhido e vai para Minhas reservas', async () => {
    const user = userEvent.setup();
    const criar = vi.fn(async () => ({
      reserva: {
        id: 1048,
        clienteId: 1,
        quadraId: 3,
        data: '2026-09-20',
        horaInicio: '15:00',
        horaFim: '16:30',
        valor: 135,
        status: StatusReserva.Confirmada,
        dataCriacao: '2026-09-20T13:00:00.000Z',
      },
      pagamento: {
        id: 1,
        reservaId: 1048,
        valor: 135,
        metodo: MetodoPagamento.Dinheiro,
        status: StatusPagamento.Pendente,
        dataPagamento: null,
      },
    }));
    const { servicos, consultarDisponibilidade } = criarServicos(criar);
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: /Quadra 03/ }));
    await user.click(screen.getByRole('button', { name: '1h30' }));
    await screen.findByRole('button', { name: '15:00' });
    expect(consultarDisponibilidade).toHaveBeenLastCalledWith(3, '2026-09-20');
    await user.click(screen.getByRole('button', { name: '15:00' }));
    await user.click(botaoResumo());

    const dialogo = screen.getByRole('dialog', { name: 'Confirmar reserva' });
    expect(within(dialogo).getByText('Quadra 03 · Beach Tennis')).toBeInTheDocument();
    expect(within(dialogo).getByText('20/09/2026')).toBeInTheDocument();
    expect(within(dialogo).getByText('15:00–16:30')).toBeInTheDocument();
    expect(within(dialogo).getByText('R$ 135,00')).toBeInTheDocument();
    expect(within(dialogo).getByRole('button', { name: 'Pix' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialogo).getByText('Pagamento simulado — aprovado na hora.')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Dinheiro' }));
    expect(within(dialogo).getByText('Pague na arena; o administrador confirma o recebimento.')).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar e pagar' }));

    expect(await screen.findByText('Página Minhas reservas')).toBeInTheDocument();
    expect(screen.getByText('Reserva RSV-1048 criada — R$ 135,00')).toBeInTheDocument();
    expect(criar).toHaveBeenCalledWith({
      clienteId: 1,
      quadraId: 3,
      data: '2026-09-20',
      horaInicio: '15:00',
      duracaoMinutos: 90,
      metodoPagamento: MetodoPagamento.Dinheiro,
    });
  });

  it('exibe o erro do backend, fecha o diálogo e limpa o horário', async () => {
    const user = userEvent.setup();
    const criar = vi.fn(async () => {
      throw new DomainError('RN04', 'RN04 — já existe uma reserva para esta quadra neste horário.');
    });
    const { servicos } = criarServicos(criar);
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: '15:00' }));
    await user.click(botaoResumo());
    await user.click(screen.getByRole('button', { name: 'Confirmar e pagar' }));

    expect(await screen.findByText('RN04 — já existe uma reserva para esta quadra neste horário.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
    expect(botaoResumo()).toHaveTextContent('Selecione um horário');
    expect(screen.queryByText('Página Minhas reservas')).not.toBeInTheDocument();
  });

  it('volta do diálogo sem reservar', async () => {
    const user = userEvent.setup();
    const criar = vi.fn();
    const { servicos } = criarServicos(criar);
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: '15:00' }));
    await user.click(botaoResumo());
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(botaoResumo()).toHaveTextContent('Confirmar reserva');
    expect(criar).not.toHaveBeenCalled();
  });
});
