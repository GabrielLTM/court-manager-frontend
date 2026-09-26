import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import { createFakeServices, SESSAO_ADMIN, SESSAO_CLIENTE } from '../testing/fakeServices';
import { renderAppAt } from '../testing/renderApp';

// Páginas de outras features são substituídas: aqui testamos rotas, guards e layout.
const { paginaFalsa } = vi.hoisted(() => ({
  paginaFalsa: (titulo: string) => async () => {
    const { createElement } = await import('react');
    return { default: () => createElement('h1', null, titulo) };
  },
}));
vi.mock('@/presentation/features/reservar/ReservarPage', paginaFalsa('Página: Reservar quadra'));
vi.mock(
  '@/presentation/features/minhas-reservas/MinhasReservasPage',
  paginaFalsa('Página: Minhas reservas'),
);
vi.mock('@/presentation/features/admin/dashboard/DashboardPage', paginaFalsa('Página: Dashboard'));
vi.mock('@/presentation/features/admin/grade/GradeReservasPage', paginaFalsa('Página: Grade'));
vi.mock('@/presentation/features/admin/quadras/QuadrasPage', paginaFalsa('Página: Quadras'));
// Uma página que quebra ao renderizar: o erro deve aparecer dentro do layout.
vi.mock('@/presentation/features/admin/clientes/ClientesPage', () => ({
  default: () => {
    throw new Error('Falha de teste ao renderizar a página');
  },
}));
vi.mock(
  '@/presentation/features/admin/pagamentos/PagamentosPage',
  paginaFalsa('Página: Pagamentos'),
);

const pagina = (titulo: string) => screen.findByRole('heading', { level: 1, name: titulo });

describe('roteamento e guards', () => {
  it('sem sessão, "/" leva ao login', async () => {
    const { services } = createFakeServices();
    const { router } = renderAppAt('/', services);

    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    await waitFor(() => expect(document.title).toBe('Entrar · Arena Beach Tennis'));
  });

  it('rota protegida sem sessão vai para /login e volta para a origem após entrar', async () => {
    const { services } = createFakeServices();
    const { router, user } = renderAppAt('/minhas-reservas', services);

    await screen.findByRole('heading', { name: 'Bem-vindo de volta' });
    expect(router.state.location.state).toEqual({
      from: { pathname: '/minhas-reservas', search: '', hash: '' },
    });

    await user.click(screen.getByRole('button', { name: 'Cliente', pressed: false }));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await pagina('Página: Minhas reservas')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/minhas-reservas');
    expect(services.auth.login).toHaveBeenCalledWith({
      email: CONTAS_DEMO[Perfil.Cliente].email,
      senha: CONTAS_DEMO[Perfil.Cliente].senha,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Bem-vindo(a), Isadora!');
  });

  it('ignora a origem quando ela não pertence ao perfil que entrou', async () => {
    const { services } = createFakeServices();
    const { router, user } = renderAppAt('/meus-dados', services);

    await screen.findByRole('heading', { name: 'Bem-vindo de volta' });
    await user.click(screen.getByRole('button', { name: 'Administrador' }));
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await pagina('Página: Dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');
  });

  it('perfil errado é levado para a própria home', async () => {
    const { services } = createFakeServices({ sessao: SESSAO_CLIENTE });
    const { router } = renderAppAt('/admin/quadras', services);

    expect(await pagina('Página: Reservar quadra')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reservar');
  });

  it('/admin abre o dashboard e o usuário logado não vê o login', async () => {
    const { services } = createFakeServices({ sessao: SESSAO_ADMIN });
    const { router } = renderAppAt('/admin', services);

    expect(await pagina('Página: Dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');

    await act(() => router.navigate('/login'));
    expect(await pagina('Página: Dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');
  });

  it('mostra a navegação do perfil com a página atual destacada e define o título', async () => {
    const { services } = createFakeServices({ sessao: SESSAO_ADMIN });
    const { user, router } = renderAppAt('/admin/dashboard', services);

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Dashboard',
      'Grade de reservas',
      'Quadras',
      'Clientes',
      'Pagamentos',
    ]);
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(nav).getByRole('link', { name: 'Pagamentos' }));
    expect(await pagina('Página: Pagamentos')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/pagamentos');
    await waitFor(() => expect(document.title).toBe('Pagamentos · Arena Beach Tennis'));
    expect(screen.getByText('Gabriel Lessa')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('"Sair" encerra a sessão, volta ao login e avisa', async () => {
    const { services } = createFakeServices({ sessao: SESSAO_CLIENTE });
    const { user, router } = renderAppAt('/reservar', services);

    await pagina('Página: Reservar quadra');
    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(services.auth.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Sessão encerrada');
  });

  it('perda de sessão (token expirado / 401) redireciona automaticamente para o login', async () => {
    const { services, definirSessao } = createFakeServices({ sessao: SESSAO_CLIENTE });
    const { router } = renderAppAt('/minhas-reservas', services);

    await pagina('Página: Minhas reservas');
    act(() => definirSessao(null));

    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toEqual({
      from: { pathname: '/minhas-reservas', search: '', hash: '' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão expirou. Entre novamente.');
  });

  it('a troca de perfil de demonstração entra com a outra conta e abre a home dela', async () => {
    const { services } = createFakeServices({ sessao: SESSAO_CLIENTE });
    const { user, router } = renderAppAt('/meus-dados', services);

    const troca = await screen.findByRole('radiogroup', { name: 'Perfil de demonstração' });
    await user.click(within(troca).getByRole('radio', { name: 'Admin' }));

    expect(await pagina('Página: Dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');
    expect(services.auth.login).toHaveBeenCalledWith({
      email: CONTAS_DEMO[Perfil.Administrador].email,
      senha: CONTAS_DEMO[Perfil.Administrador].senha,
    });
    expect(within(troca).getByRole('radio', { name: 'Admin' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('erro em uma página aparece dentro do layout, com caminho de volta', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { services } = createFakeServices({ sessao: SESSAO_ADMIN });
    const { user, router } = renderAppAt('/admin/clientes', services);

    expect(await screen.findByRole('heading', { name: 'Algo deu errado' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Voltar para o início' }));
    expect(await pagina('Página: Dashboard')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');
    consoleError.mockRestore();
  });

  it('endereço desconhecido mostra a página 404 com link para o início', async () => {
    const { services } = createFakeServices();
    const { user, router } = renderAppAt('/nao-existe', services);

    expect(await screen.findByRole('heading', { name: 'Bola fora!' })).toBeInTheDocument();
    expect(screen.getByText('/nao-existe')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Página não encontrada · Arena Beach Tennis'));

    await user.click(screen.getByRole('link', { name: 'Voltar para o início' }));
    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});
