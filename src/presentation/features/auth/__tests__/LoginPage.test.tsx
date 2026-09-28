import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/application/errors';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import {
  createFakeServices,
  MENSAGEM_CREDENCIAIS_INVALIDAS,
} from '@/presentation/app/testing/fakeServices';
import { renderAppAt } from '@/presentation/app/testing/renderApp';

// As homes dos perfis pertencem a outras features: basta um marcador.
vi.mock('@/presentation/features/reservar/ReservarPage', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('h1', null, 'Página: Reservar quadra') };
});
vi.mock('@/presentation/features/admin/dashboard/DashboardPage', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('h1', null, 'Página: Dashboard') };
});

const card = async () =>
  (
    await screen.findByRole('heading', { level: 2, name: /Bem-vindo de volta|Criar sua conta/ })
  ).closest('section') as HTMLElement;

describe('LoginPage — Entrar', () => {
  it('reproduz a apresentação do protótipo', async () => {
    const { services } = createFakeServices();
    renderAppAt('/login', services);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Sua quadra, reservada em três toques.',
      }),
    ).toBeInTheDocument();
    for (const tag of ['6 quadras', '07h às 22h']) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: 'Entrar' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('by Ottawa Tech')).toBeInTheDocument();
    expect(screen.queryByText(/POST \/api/)).not.toBeInTheDocument();
  });

  it('valida os campos obrigatórios sem chamar a API', async () => {
    const { services } = createFakeServices();
    const { user } = renderAppAt('/login', services);

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(services.auth.login).not.toHaveBeenCalled();
  });

  it('mostra o erro da API em um toast', async () => {
    const { services } = createFakeServices();
    const { user } = renderAppAt('/login', services);

    await user.type(await screen.findByLabelText('E-mail'), 'isadora@email.com');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(MENSAGEM_CREDENCIAIS_INVALIDAS)).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveFocus();
  });

  it('o acesso rápido preenche as credenciais de demonstração e entra na home do perfil', async () => {
    const { services } = createFakeServices();
    const { user, router } = renderAppAt('/login', services);

    const acesso = await screen.findByRole('group', { name: 'Acessar como' });
    const admin = within(acesso).getByRole('button', { name: 'Administrador' });
    expect(admin).toHaveAttribute('aria-pressed', 'false');

    await user.click(admin);
    expect(admin).toHaveAttribute('aria-pressed', 'true');
    expect(within(acesso).getByRole('button', { name: 'Cliente' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByLabelText('E-mail')).toHaveValue(CONTAS_DEMO[Perfil.Administrador].email);
    expect(screen.getByLabelText('Senha')).toHaveValue(CONTAS_DEMO[Perfil.Administrador].senha);

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: 'Página: Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/dashboard');
    expect(screen.getByRole('status')).toHaveTextContent('Bem-vindo(a), Gabriel!');
  });
});

describe('LoginPage — Criar conta', () => {
  it('alterna para /cadastro preservando a origem do redirecionamento', async () => {
    const { services } = createFakeServices();
    const { user, router } = renderAppAt('/minhas-reservas', services);

    await user.click(await screen.findByRole('radio', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Criar sua conta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/cadastro');
    expect(router.state.location.state).toEqual({
      from: { pathname: '/minhas-reservas', search: '', hash: '' },
    });
    const form = within(await card());
    for (const campo of [
      'Nome completo',
      'CPF',
      'Data de nascimento',
      'Telefone',
      'E-mail',
      'Senha',
    ]) {
      expect(form.getByLabelText(campo)).toBeInTheDocument();
    }
    expect(form.queryByText('Acessar como')).not.toBeInTheDocument();
    expect(form.queryByText(/POST \/api/)).not.toBeInTheDocument();
  });

  it('cadastra, entra e vai para a home do cliente', async () => {
    const { services } = createFakeServices();
    const { user, router } = renderAppAt('/cadastro', services);

    await user.type(await screen.findByLabelText('Nome completo'), 'Bruna Carvalho');
    await user.type(screen.getByLabelText('CPF'), '27418596391');
    await user.type(screen.getByLabelText('Data de nascimento'), '1995-04-12');
    await user.type(screen.getByLabelText('Telefone'), '51994567812');
    await user.type(screen.getByLabelText('E-mail'), 'bruna@email.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo1');
    await user.click(screen.getByRole('button', { name: 'Criar conta e entrar' }));

    expect(
      await screen.findByRole('heading', { name: 'Página: Reservar quadra' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/reservar');
    expect(services.auth.registrar).toHaveBeenCalledWith({
      nome: 'Bruna Carvalho',
      cpf: '274.185.963-91',
      dataNascimento: '1995-04-12',
      telefone: '(51) 99456-7812',
      email: 'bruna@email.com',
      senha: 'segredo1',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Bem-vindo(a), Bruna!');
  });

  it('exibe no campo o conflito devolvido pela API (RN02) e avisa no toast', async () => {
    const { services } = createFakeServices();
    const mensagem = 'RN02 — este e-mail já está cadastrado.';
    services.auth.registrar.mockRejectedValueOnce(
      new AppError(mensagem, { code: 'CONFLITO', status: 409, fieldErrors: { email: [mensagem] } }),
    );
    const { user, router } = renderAppAt('/cadastro', services);

    await user.type(await screen.findByLabelText('Nome completo'), 'Isadora Oliveira');
    await user.type(screen.getByLabelText('CPF'), '27418596391');
    await user.type(screen.getByLabelText('Data de nascimento'), '1995-04-12');
    await user.type(screen.getByLabelText('Telefone'), '51994567812');
    await user.type(screen.getByLabelText('E-mail'), 'isadora@email.com');
    await user.type(screen.getByLabelText('Senha'), 'segredo1');
    await user.click(screen.getByRole('button', { name: 'Criar conta e entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(mensagem);
    expect(router.state.location.pathname).toBe('/cadastro');
  });
});
