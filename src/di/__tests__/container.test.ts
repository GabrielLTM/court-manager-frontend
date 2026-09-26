import { describe, expect, it } from 'vitest';
import { CONTAS_DEMO } from '@/config/demo';
import { Perfil } from '@/domain/enums';
import { createContainer } from '../container';

describe('createContainer', () => {
  it('modo mock: sessão persistida e backend simulado com os dados de demonstração', async () => {
    const services = createContainer({ apiMode: 'mock', apiBaseUrl: '/api' });
    await services.auth.login(CONTAS_DEMO[Perfil.Administrador]);
    expect(localStorage.getItem('arena.sessao')).toContain('Administrador');
    expect(await services.quadras.listar()).toHaveLength(6);
  });

  it('modo http: monta os adaptadores sem acessar a rede', () => {
    const services = createContainer({ apiMode: 'http', apiBaseUrl: 'http://localhost:5160/api' });
    expect(services.auth.sessaoAtual()).toBeNull();
    expect(typeof services.reservas.criar).toBe('function');
  });
});
