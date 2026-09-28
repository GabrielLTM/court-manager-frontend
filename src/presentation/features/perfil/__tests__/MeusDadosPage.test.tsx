import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppError } from '@/application/errors';
import {
  CLIENTE_DEMO,
  createFakeServices,
  SESSAO_CLIENTE,
} from '@/presentation/app/testing/fakeServices';
import { renderWithProviders } from '@/presentation/app/testing/renderApp';
import MeusDadosPage from '../MeusDadosPage';

function renderPagina() {
  const fake = createFakeServices({ sessao: SESSAO_CLIENTE });
  return { ...fake, ...renderWithProviders(<MeusDadosPage />, fake.services) };
}

describe('MeusDadosPage (RF02)', () => {
  it('carrega o cadastro do cliente logado no formulário', async () => {
    renderPagina();

    expect(screen.getByRole('heading', { level: 1, name: 'Meus dados' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Nome completo')).toHaveValue(CLIENTE_DEMO.nome);
    expect(screen.getByLabelText('CPF')).toHaveValue(CLIENTE_DEMO.cpf);
    expect(screen.getByLabelText('Data de nascimento')).toHaveValue(CLIENTE_DEMO.dataNascimento);
    expect(screen.getByLabelText('Telefone')).toHaveValue(CLIENTE_DEMO.telefone);
    expect(screen.getByLabelText('E-mail')).toHaveValue(CLIENTE_DEMO.email);
    expect(screen.getByLabelText('Nova senha')).toHaveValue('');
    expect(screen.getByText('Status do cadastro')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('salva as alterações sem enviar a senha quando ela fica em branco', async () => {
    const { services, user } = renderPagina();

    const telefone = await screen.findByLabelText('Telefone');
    await user.clear(telefone);
    await user.type(telefone, '51999990000');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados atualizados')).toBeInTheDocument();
    expect(services.perfil.atualizar).toHaveBeenCalledWith({
      nome: CLIENTE_DEMO.nome,
      cpf: CLIENTE_DEMO.cpf,
      dataNascimento: CLIENTE_DEMO.dataNascimento,
      telefone: '(51) 99999-0000',
      email: CLIENTE_DEMO.email,
    });
    expect(screen.getByLabelText('Telefone')).toHaveValue('(51) 99999-0000');
    expect(screen.queryByRole('button', { name: 'Descartar alterações' })).not.toBeInTheDocument();
  });

  it('envia a nova senha quando informada', async () => {
    const { services, user } = renderPagina();

    await user.type(await screen.findByLabelText('Nova senha'), 'novaSenha1');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados atualizados')).toBeInTheDocument();
    expect(services.perfil.atualizar).toHaveBeenCalledWith(
      expect.objectContaining({ senha: 'novaSenha1' }),
    );
    expect(screen.getByLabelText('Nova senha')).toHaveValue('');
  });

  it('valida no cliente antes de enviar', async () => {
    const { services, user } = renderPagina();

    const email = await screen.findByLabelText('E-mail');
    await user.clear(email);
    await user.type(email, 'email-invalido');
    await user.type(screen.getByLabelText('Nova senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Formato de e-mail inválido.')).toBeInTheDocument();
    expect(screen.getByText('A senha deve ter pelo menos 6 caracteres.')).toBeInTheDocument();
    expect(services.perfil.atualizar).not.toHaveBeenCalled();
  });

  it('descarta as alterações locais', async () => {
    const { user } = renderPagina();

    const nome = await screen.findByLabelText('Nome completo');
    await user.clear(nome);
    await user.type(nome, 'Outro Nome');
    await user.click(screen.getByRole('button', { name: 'Descartar alterações' }));

    expect(screen.getByLabelText('Nome completo')).toHaveValue(CLIENTE_DEMO.nome);
  });

  it('mostra o conflito de CPF (RN01) no campo e no toast', async () => {
    const { services, user } = renderPagina();
    const mensagem = 'RN01 — já existe um cliente ativo com este CPF.';
    services.perfil.atualizar.mockRejectedValueOnce(
      new AppError(mensagem, { code: 'CONFLITO', status: 409, fieldErrors: { cpf: [mensagem] } }),
    );

    const cpf = await screen.findByLabelText('CPF');
    await user.clear(cpf);
    await user.type(cpf, '27418596391');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(mensagem);
  });
});
