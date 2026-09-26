import { QueryClient } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { RegistrarPagamentoInput, ReservaDetalhada } from '@/application/dto';
import type { AppServices } from '@/application/services';
import type { Pagamento, Quadra, Sessao } from '@/domain/entities';
import { MetodoPagamento, Perfil, StatusPagamento, StatusQuadra, StatusReserva } from '@/domain/enums';
import { DomainError } from '@/domain/errors/DomainError';
import { calcularDuracaoMinutos } from '@/domain/rules';
import { AppProviders } from '@/presentation/providers/AppProviders';
import { ROUTES } from '@/presentation/routes/paths';
import MinhasReservasPage from '../MinhasReservasPage';

const SESSAO: Sessao = {
  token: 'token',
  usuario: { id: 7, nome: 'Isadora Oliveira', email: 'isadora@email.com', perfil: Perfil.Cliente, clienteId: 1 },
  expiraEm: null,
};

const quadra = (id: number): Quadra => ({
  id,
  nome: `Quadra 0${id}`,
  tipo: 'Beach Tennis',
  valorHora: 80,
  status: StatusQuadra.Ativa,
});

const pagamento = (reservaId: number, status: StatusPagamento, metodo: MetodoPagamento): Pagamento => ({
  id: reservaId + 5000,
  reservaId,
  valor: 80,
  metodo,
  status,
  dataPagamento: null,
});

function reserva(
  id: number,
  quadraId: number,
  data: string,
  horario: [string, string],
  status: StatusReserva,
  pag: Pagamento | null,
  valor = 80,
): ReservaDetalhada {
  const [horaInicio, horaFim] = horario;
  return {
    id,
    clienteId: 1,
    quadraId,
    data,
    horaInicio,
    horaFim,
    valor,
    status,
    dataCriacao: '2026-09-01T12:00:00.000Z',
    duracaoMinutos: calcularDuracaoMinutos(horaInicio, horaFim),
    quadra: quadra(quadraId),
    cliente: { id: 1, nome: 'Isadora Oliveira' },
    pagamento: pag,
  };
}

/** "Agora": 20/09/2026 às 10:00. */
const RESERVAS: ReservaDetalhada[] = [
  reserva(1046, 3, '2026-09-14', ['07:00', '08:00'], StatusReserva.Concluida, pagamento(1046, StatusPagamento.Pago, MetodoPagamento.Pix)),
  reserva(1041, 1, '2026-09-20', ['19:00', '20:00'], StatusReserva.Confirmada, pagamento(1041, StatusPagamento.Pago, MetodoPagamento.Pix)),
  reserva(1043, 4, '2026-09-21', ['20:00', '21:00'], StatusReserva.Pendente, null, 70),
  // Começa em 2 horas: fora da janela de cancelamento do cliente (RN08).
  reserva(1049, 1, '2026-09-20', ['12:00', '13:00'], StatusReserva.Confirmada, pagamento(1049, StatusPagamento.Pendente, MetodoPagamento.Dinheiro)),
];

function criarServicos(overrides: {
  listar?: () => Promise<ReservaDetalhada[]>;
  cancelar?: (id: number) => Promise<unknown>;
  registrar?: (input: RegistrarPagamentoInput) => Promise<Pagamento>;
} = {}) {
  const servicos = {
    auth: { sessaoAtual: () => SESSAO, subscribe: () => () => {}, login: vi.fn(), registrar: vi.fn(), logout: vi.fn() },
    clock: { now: () => new Date(2026, 8, 20, 10, 0) },
    reservas: {
      listar: vi.fn(overrides.listar ?? (async () => RESERVAS)),
      cancelar: vi.fn(overrides.cancelar ?? (async () => ({}))),
    },
    pagamentos: { registrar: vi.fn(overrides.registrar ?? (async () => pagamento(0, StatusPagamento.Pago, MetodoPagamento.Pix))) },
  };
  return servicos;
}

function renderizar(servicos: unknown) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return render(
    <AppProviders services={servicos as AppServices} queryClient={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.minhasReservas]}>
        <MinhasReservasPage />
      </MemoryRouter>
    </AppProviders>,
  );
}

const valorDoCard = (rotulo: string) => (screen.getByText(rotulo).parentElement as HTMLElement).textContent;

describe('MinhasReservasPage', () => {
  it('mostra os indicadores e as reservas ordenadas com as ações permitidas', async () => {
    renderizar(criarServicos());

    await screen.findByRole('table', { name: 'Minhas reservas' });
    expect(valorDoCard('Próximas reservas')).toBe('Próximas reservas3');
    expect(valorDoCard('Pagamentos pendentes')).toBe('Pagamentos pendentes2');
    expect(valorDoCard('Horas jogadas no mês')).toBe('Horas jogadas no mês1h');

    const [, ...linhas] = screen.getAllByRole('row');
    expect(linhas.map((linha) => within(linha).getAllByRole('cell')[2].textContent)).toEqual([
      '12:00–13:00',
      '19:00–20:00',
      '20:00–21:00',
      '07:00–08:00',
    ]);

    const [hojeMeioDia, hojeNoite, amanha, passada] = linhas;
    expect(within(hojeMeioDia).queryByRole('button')).not.toBeInTheDocument();
    expect(within(hojeMeioDia).getByText('Dinheiro')).toBeInTheDocument();
    expect(within(hojeNoite).getByRole('button', { name: 'Cancelar reserva RSV-1041' })).toBeInTheDocument();
    expect(within(hojeNoite).queryByRole('button', { name: /Pagar/ })).not.toBeInTheDocument();
    expect(within(amanha).getByRole('button', { name: 'Pagar reserva RSV-1043' })).toBeInTheDocument();
    expect(within(amanha).getByRole('button', { name: 'Cancelar reserva RSV-1043' })).toBeInTheDocument();
    expect(within(passada).getByText('Concluída')).toBeInTheDocument();
    expect(within(passada).queryByRole('button')).not.toBeInTheDocument();

    expect(
      screen.getByText('RN08 — o cancelamento é permitido até 4 horas antes do horário da reserva.'),
    ).toBeInTheDocument();
  });

  it('cancela uma reserva após a confirmação', async () => {
    const user = userEvent.setup();
    const servicos = criarServicos();
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva RSV-1043' }));
    const dialogo = screen.getByRole('dialog', { name: 'Cancelar reserva?' });
    expect(within(dialogo).getByText('RSV-1043')).toBeInTheDocument();
    expect(within(dialogo).getByText('Quadra 04')).toBeInTheDocument();
    expect(within(dialogo).getByText('21/09 · 20:00–21:00')).toBeInTheDocument();
    expect(within(dialogo).getByText('Será cancelado')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));

    expect(await screen.findByText('Reserva RSV-1043 cancelada — horário liberado')).toBeInTheDocument();
    expect(servicos.reservas.cancelar).toHaveBeenCalledWith(1043);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Invalidação do cache: a lista é recarregada.
    expect(servicos.reservas.listar).toHaveBeenCalledTimes(2);
  });

  it('informa que o pagamento será estornado e exibe a recusa do backend (RN08)', async () => {
    const user = userEvent.setup();
    const servicos = criarServicos({
      cancelar: async () => {
        throw new DomainError('RN08', 'RN08 — o cancelamento é permitido até 4 horas antes do horário da reserva.');
      },
    });
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva RSV-1041' }));
    const dialogo = screen.getByRole('dialog', { name: 'Cancelar reserva?' });
    expect(within(dialogo).getByText('Será estornado')).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar reserva' }));

    const toast = await screen.findByText(
      'RN08 — o cancelamento é permitido até 4 horas antes do horário da reserva.',
      { selector: 'div' },
    );
    expect(toast).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mantém a reserva ao escolher "Manter"', async () => {
    const user = userEvent.setup();
    const servicos = criarServicos();
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva RSV-1041' }));
    await user.click(screen.getByRole('button', { name: 'Manter' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(servicos.reservas.cancelar).not.toHaveBeenCalled();
  });

  it('registra o pagamento de uma reserva sem pagamento', async () => {
    const user = userEvent.setup();
    const servicos = criarServicos({
      registrar: async ({ reservaId, metodo }) => ({ ...pagamento(reservaId, StatusPagamento.Pago, metodo), valor: 70 }),
    });
    renderizar(servicos);

    await user.click(await screen.findByRole('button', { name: 'Pagar reserva RSV-1043' }));
    const dialogo = screen.getByRole('dialog', { name: 'Pagar reserva' });
    expect(within(dialogo).getByText('R$ 70,00')).toBeInTheDocument();
    await user.click(within(dialogo).getByRole('button', { name: 'Cartão' }));
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar pagamento' }));

    expect(await screen.findByText('Pagamento RSV-1043 aprovado — R$ 70,00')).toBeInTheDocument();
    expect(servicos.pagamentos.registrar).toHaveBeenCalledWith({ reservaId: 1043, metodo: MetodoPagamento.Cartao });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('convida a reservar quando não há reservas', async () => {
    renderizar(criarServicos({ listar: async () => [] }));

    expect(await screen.findByText('Você ainda não tem reservas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservar quadra' })).toHaveAttribute('href', ROUTES.reservar);
    expect(valorDoCard('Horas jogadas no mês')).toBe('Horas jogadas no mês0h');
  });
});
