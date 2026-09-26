import { describe, expect, it } from 'vitest';
import { Perfil } from '@/domain/enums';
import { destinoAposLogin, lerOrigem, perfilExigido } from '../guards/access';

const de = (pathname: string, search = '', hash = '') => ({ from: { pathname, search, hash } });

describe('perfilExigido', () => {
  it('identifica as áreas de cada perfil', () => {
    expect(perfilExigido('/reservar')).toBe(Perfil.Cliente);
    expect(perfilExigido('/minhas-reservas')).toBe(Perfil.Cliente);
    expect(perfilExigido('/meus-dados')).toBe(Perfil.Cliente);
    expect(perfilExigido('/admin')).toBe(Perfil.Administrador);
    expect(perfilExigido('/admin/pagamentos')).toBe(Perfil.Administrador);
  });

  it('não confunde prefixos parecidos nem rotas públicas', () => {
    expect(perfilExigido('/administracao')).toBeNull();
    expect(perfilExigido('/reservar-agora')).toBeNull();
    expect(perfilExigido('/login')).toBeNull();
    expect(perfilExigido('/')).toBeNull();
  });
});

describe('destinoAposLogin', () => {
  it('volta para a origem quando o perfil pode acessá-la (com query e hash)', () => {
    expect(destinoAposLogin(de('/minhas-reservas', '?pagina=2', '#topo'), Perfil.Cliente)).toBe(
      '/minhas-reservas?pagina=2#topo',
    );
    expect(destinoAposLogin(de('/admin/quadras'), Perfil.Administrador)).toBe('/admin/quadras');
  });

  it('usa a home do perfil quando a origem é de outro perfil, pública ou ausente', () => {
    expect(destinoAposLogin(de('/admin/quadras'), Perfil.Cliente)).toBe('/reservar');
    expect(destinoAposLogin(de('/meus-dados'), Perfil.Administrador)).toBe('/admin/dashboard');
    expect(destinoAposLogin(de('/login'), Perfil.Cliente)).toBe('/reservar');
    expect(destinoAposLogin(null, Perfil.Administrador)).toBe('/admin/dashboard');
  });

  it('nunca redireciona para fora da aplicação', () => {
    expect(destinoAposLogin(de('//exemplo.com/admin'), Perfil.Administrador)).toBe(
      '/admin/dashboard',
    );
    expect(destinoAposLogin({ from: { pathname: 'https://exemplo.com' } }, Perfil.Cliente)).toBe(
      '/reservar',
    );
  });
});

describe('lerOrigem', () => {
  it('tolera estados inválidos', () => {
    expect(lerOrigem(undefined)).toBeNull();
    expect(lerOrigem('texto')).toBeNull();
    expect(lerOrigem({ from: 42 })).toBeNull();
    expect(lerOrigem({ from: { pathname: '/reservar' } })).toEqual({
      pathname: '/reservar',
      search: '',
      hash: '',
    });
  });
});
