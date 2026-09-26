import { describe, expect, it, vi } from 'vitest';
import type { RegistrarClienteInput } from '@/application/dto';
import { MENSAGENS } from '@/application/mensagens';
import { Perfil } from '@/domain/enums';
import { criarAmbiente } from './ambiente';

const novoCliente: RegistrarClienteInput = {
  nome: 'Helena Souza',
  cpf: '529.982.247-25',
  telefone: '51999990000',
  email: 'helena@email.com',
  dataNascimento: '2001-05-10',
  senha: 'segredo1',
};

describe('Autenticação — backend simulado', () => {
  it('aceita as contas de demonstração e guarda a sessão', async () => {
    const { services, sessionStore, entrarComoCliente, entrarComoAdmin } = criarAmbiente();

    const cliente = await entrarComoCliente();
    expect(cliente.usuario).toEqual({
      id: 1,
      nome: 'Isadora Oliveira',
      email: 'isadora@email.com',
      perfil: Perfil.Cliente,
      clienteId: 1,
    });
    expect(cliente.token.split('.')).toHaveLength(3);
    expect(cliente.expiraEm).toBe(new Date(2026, 8, 20, 20, 0).toISOString());
    expect(services.auth.sessaoAtual()).toBe(sessionStore.get());

    const admin = await entrarComoAdmin();
    expect(admin.usuario).toMatchObject({
      nome: 'Gabriel Lessa',
      perfil: Perfil.Administrador,
      clienteId: null,
    });
  });

  it('e-mail sem diferenciar maiúsculas; credenciais erradas → 401', async () => {
    const { services } = criarAmbiente();
    await expect(
      services.auth.login({ email: ' ISADORA@email.com ', senha: '123456' }),
    ).resolves.toBeTruthy();
    await expect(
      services.auth.login({ email: 'isadora@email.com', senha: 'errada' }),
    ).rejects.toMatchObject({
      code: 'NAO_AUTENTICADO',
      status: 401,
      message: MENSAGENS.credenciaisInvalidas,
    });
  });

  it('cliente inativo não entra (403)', async () => {
    const { services } = criarAmbiente();
    await expect(
      services.auth.login({ email: 'marina@email.com', senha: '123456' }),
    ).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
      message: MENSAGENS.cadastroInativo,
    });
  });

  it('autocadastro cria cliente ativo e já autentica (RF01)', async () => {
    const { services } = criarAmbiente();
    const sessao = await services.auth.registrar(novoCliente);
    expect(sessao.usuario).toMatchObject({ id: 13, perfil: Perfil.Cliente, clienteId: 13 });
    expect(await services.perfil.obter()).toMatchObject({
      cpf: '529.982.247-25',
      telefone: '(51) 99999-0000',
    });
  });

  it('RN01: CPF de cliente ativo já cadastrado → 409 no campo cpf', async () => {
    const { services } = criarAmbiente();
    await expect(
      services.auth.registrar({ ...novoCliente, cpf: '01234567890' }),
    ).rejects.toMatchObject({
      code: 'CONFLITO',
      status: 409,
      fieldErrors: { cpf: [expect.stringMatching(/^RN01/)] },
    });
  });

  it('RN01: o CPF de um cliente inativo pode ser reutilizado', async () => {
    const { services } = criarAmbiente();
    await expect(
      services.auth.registrar({ ...novoCliente, cpf: '159.753.486-25' }),
    ).resolves.toBeTruthy();
  });

  it('RN02: e-mail já cadastrado (inclusive o administrativo) → 409 no campo email', async () => {
    const { services } = criarAmbiente();
    for (const email of ['Gabriel@Email.com', 'admin@arena.com']) {
      await expect(services.auth.registrar({ ...novoCliente, email })).rejects.toMatchObject({
        code: 'CONFLITO',
        fieldErrors: { email: [expect.stringMatching(/^RN02/)] },
      });
    }
  });

  it('valida o formato antes de chamar o backend', async () => {
    const { services } = criarAmbiente();
    await expect(
      services.auth.registrar({ ...novoCliente, cpf: '123.456.789-00' }),
    ).rejects.toMatchObject({
      regra: 'VALIDACAO',
      message: 'CPF inválido.',
    });
  });

  it('logout limpa a sessão e notifica os inscritos', async () => {
    const { services, entrarComoCliente } = criarAmbiente();
    await entrarComoCliente();
    const listener = vi.fn();
    const cancelar = services.auth.subscribe(listener);
    services.auth.logout();
    expect(services.auth.sessaoAtual()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    cancelar();
  });

  it('sem sessão ou com token adulterado → 401 (e a sessão é descartada)', async () => {
    const { services, sessionStore, entrarComoCliente } = criarAmbiente();
    await expect(services.quadras.listar()).rejects.toMatchObject({
      code: 'NAO_AUTENTICADO',
      status: 401,
    });

    const sessao = await entrarComoCliente();
    sessionStore.set({
      ...sessao,
      usuario: { ...sessao.usuario, perfil: Perfil.Administrador },
      token: `${sessao.token}x`,
    });
    await expect(services.clientes.listar()).rejects.toMatchObject({ status: 401 });
    expect(sessionStore.get()).toBeNull();
  });

  it('token expirado → 401', async () => {
    const { services, entrarComoCliente, definirAgora } = criarAmbiente();
    await entrarComoCliente();
    definirAgora(new Date(2026, 8, 20, 21, 0));
    await expect(services.quadras.listar()).rejects.toMatchObject({ status: 401 });
  });

  it('"Meus dados": atualizar sincroniza o nome da sessão; admin não tem perfil de cliente', async () => {
    const { services, sessionStore, entrarComoCliente, entrarComoAdmin } = criarAmbiente();
    await entrarComoCliente();
    const atual = await services.perfil.obter();
    const atualizado = await services.perfil.atualizar({ ...atual, nome: 'Isadora O. Souza' });
    expect(atualizado.nome).toBe('Isadora O. Souza');
    expect(sessionStore.get()?.usuario.nome).toBe('Isadora O. Souza');
    await expect(
      services.auth.login({ email: 'isadora@email.com', senha: '123456' }),
    ).resolves.toBeTruthy();

    await entrarComoAdmin();
    await expect(services.perfil.obter()).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
  });
});
