import { describe, expect, it, vi } from 'vitest';
import type { Sessao } from '@/domain/entities';
import { Perfil } from '@/domain/enums';
import { criarArmazenamentoEmMemoria } from '../armazenamento';
import { CHAVE_SESSAO, createLocalStorageSessionStore } from '../LocalStorageSessionStore';

const agora = new Date(2026, 8, 20, 12, 0);
const clock = { now: () => agora };
const sessao = (expiraEm: string | null = new Date(2026, 8, 20, 20, 0).toISOString()): Sessao => ({
  token: 'a.b.c',
  expiraEm,
  usuario: {
    id: 1,
    nome: 'Isadora Oliveira',
    email: 'isadora@email.com',
    perfil: Perfil.Cliente,
    clienteId: 1,
  },
});

describe('LocalStorageSessionStore', () => {
  it('persiste a sessão e devolve sempre a mesma referência', () => {
    const storage = criarArmazenamentoEmMemoria();
    const store = createLocalStorageSessionStore({ storage, clock });
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(sessao());
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe(store.get());
    expect(JSON.parse(storage.getItem(CHAVE_SESSAO) ?? 'null')).toEqual(sessao());

    const outraInstancia = createLocalStorageSessionStore({ storage, clock });
    expect(outraInstancia.get()).toEqual(sessao());

    store.set(null);
    expect(store.get()).toBeNull();
    expect(storage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it('descarta sessões expiradas ou corrompidas', () => {
    const storage = criarArmazenamentoEmMemoria();
    storage.setItem(
      CHAVE_SESSAO,
      JSON.stringify(sessao(new Date(2026, 8, 20, 11, 0).toISOString())),
    );
    expect(createLocalStorageSessionStore({ storage, clock }).get()).toBeNull();
    expect(storage.getItem(CHAVE_SESSAO)).toBeNull();

    storage.setItem(CHAVE_SESSAO, '{ inválido');
    expect(createLocalStorageSessionStore({ storage, clock }).get()).toBeNull();
    storage.setItem(
      CHAVE_SESSAO,
      JSON.stringify({ token: 'x', usuario: { id: 1, perfil: 'Root' } }),
    );
    expect(createLocalStorageSessionStore({ storage, clock }).get()).toBeNull();
  });

  it('continua funcionando em memória quando o storage falha', () => {
    const quebrado = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const store = createLocalStorageSessionStore({ storage: quebrado, clock });
    const atual = sessao();
    store.set(atual);
    expect(store.get()).toBe(atual);
  });

  it('sincroniza login/logout feitos em outra aba (evento storage)', () => {
    const store = createLocalStorageSessionStore({ clock });
    const listener = vi.fn();
    store.subscribe(listener);

    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao()));
    window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_SESSAO }));
    expect(store.get()?.usuario.nome).toBe('Isadora Oliveira');

    localStorage.removeItem(CHAVE_SESSAO);
    window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_SESSAO }));
    expect(store.get()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
