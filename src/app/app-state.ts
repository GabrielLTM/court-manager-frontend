import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AppServices } from '@/core/application/services';
import { getErrorMessage } from '@/shared/ui/errors';
import { homePathFor } from './paths';
export const APP_SERVICES = new InjectionToken<AppServices>('AppServices');
@Injectable({ providedIn: 'root' })
export class AppState {
  readonly services = inject(APP_SERVICES);
  private router = inject(Router);
  readonly session = signal(this.services.auth.sessaoAtual());
  readonly notices = signal<{ id: number; text: string; error: boolean }[]>([]);
  readonly fatalError = signal('');
  readonly confirmation = signal<{
    title: string;
    text: string;
    resolve: (value: boolean) => void;
  } | null>(null);
  private serial = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  constructor() {
    const sync = () => {
      const previous = this.session();
      const current = this.services.auth.sessaoAtual();
      this.session.set(current);
      if (previous && !current) {
        this.notify('Sua sessão foi encerrada. Entre novamente.');
        void this.router.navigate(['/login'], { queryParams: { from: this.router.url } });
      }
    };
    const unsubscribe = this.services.auth.subscribe(sync);
    const timer = setInterval(sync, 15000);
    inject(DestroyRef).onDestroy(() => {
      unsubscribe();
      clearInterval(timer);
      this.timers.forEach(clearTimeout);
    });
  }
  notify(text: string, error = false) {
    const id = ++this.serial;
    this.notices.update((n) => [...n, { id, text, error }]);
    const timer = setTimeout(() => {
      this.dismiss(id);
      this.timers.delete(timer);
    }, 6000);
    this.timers.add(timer);
  }
  dismiss(id: number) {
    this.notices.update((n) => n.filter((x) => x.id !== id));
  }
  error(error: unknown) {
    this.notify(getErrorMessage(error), true);
  }
  ask(title: string, text: string): Promise<boolean> {
    this.confirmation()?.resolve(false);
    return new Promise((resolve) => this.confirmation.set({ title, text, resolve }));
  }
  answer(value: boolean) {
    this.confirmation()?.resolve(value);
    this.confirmation.set(null);
  }
  logout() {
    this.services.auth.logout();
    void this.router.navigateByUrl('/login');
  }
  home() {
    return this.session() ? homePathFor(this.session()!.usuario.perfil) : '/login';
  }
}
