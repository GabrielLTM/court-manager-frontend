import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { signal } from '@angular/core';
import { AppState } from '../state';
import { authenticated, publicOnly } from '../routes';
import { AsyncPage } from '../shared';
import { Perfil } from '@/domain/enums';
import type { Sessao } from '@/domain/entities';

function stateFor(session: Sessao | null) {
  return {
    services: { auth: { sessaoAtual: () => session } },
    home: () =>
      session?.usuario.perfil === Perfil.Administrador ? '/admin/dashboard' : '/reservar',
  };
}
const client: Sessao = {
  token: 'mock',
  expiraEm: null,
  usuario: {
    id: 1,
    clienteId: 1,
    nome: 'Cliente',
    email: 'cliente@example.com',
    perfil: Perfil.Cliente,
  },
};
describe('Angular access guards', () => {
  it('preserves protected origin without exposing admin content', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AppState, useValue: stateFor(null) }],
    });
    const route = { data: { role: Perfil.Administrador } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin/clientes?pagina=2' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authenticated(route, state)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/login?from=%2Fadmin%2Fclientes%3Fpagina%3D2',
    );
  });
  it('redirects the wrong profile and authenticated public access to its home', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AppState, useValue: stateFor(client) }],
    });
    const route = { data: { role: Perfil.Administrador } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/admin/clientes' } as RouterStateSnapshot;
    const router = TestBed.inject(Router);
    expect(
      router.serializeUrl(
        TestBed.runInInjectionContext(() => authenticated(route, state)) as UrlTree,
      ),
    ).toBe('/reservar');
    expect(
      router.serializeUrl(TestBed.runInInjectionContext(() => publicOnly(route, state)) as UrlTree),
    ).toBe('/reservar');
  });
  it('allows the required profile', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AppState, useValue: stateFor(client) }],
    });
    expect(
      TestBed.runInInjectionContext(() =>
        authenticated(
          { data: { role: Perfil.Cliente } } as unknown as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ),
    ).toBe(true);
  });
});
class TestPage extends AsyncPage {
  value = signal('');
  load(task: () => Promise<string>) {
    return this.request(task, (value) => this.value.set(value));
  }
  save(task: () => Promise<unknown>, success: () => void) {
    return this.mutate(task, success);
  }
}
describe('Angular asynchronous page lifecycle', () => {
  it('discards superseded requests and supports explicit recovery', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AppState, useValue: { services: {}, error: vi.fn() } }],
    });
    const page = TestBed.runInInjectionContext(() => new TestPage());
    let resolve!: (value: string) => void;
    const old = page.load(() => new Promise((r) => (resolve = r)));
    await page.load(() => Promise.resolve('new'));
    resolve('old');
    await old;
    expect(page.value()).toBe('new');
    await page.load(() => Promise.reject(new Error('Rede indisponível')));
    expect(page.error()).toBe('Rede indisponível');
    expect(page.loading()).toBe(false);
    await page.load(() => Promise.resolve('recovered'));
    expect(page.value()).toBe('recovered');
    expect(page.error()).toBe('');
  });
  it('prevents duplicate mutation and releases busy state after failure', async () => {
    const error = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: AppState, useValue: { services: {}, error } }],
    });
    const page = TestBed.runInInjectionContext(() => new TestPage());
    let reject!: (reason: Error) => void;
    const operation = vi.fn(() => new Promise((_, r) => (reject = r)));
    const success = vi.fn();
    const pending = page.save(operation, success);
    await page.save(operation, success);
    expect(operation).toHaveBeenCalledTimes(1);
    reject(new Error('Conflito'));
    await pending;
    expect(success).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    expect(page.busy()).toBe(false);
  });
});
