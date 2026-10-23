import { Component, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  NavigationError,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppState } from './state';
import { DialogComponent } from './shared';
import { CONTAS_DEMO } from '@/config/demo';
import { isMockMode } from '@/config/env';
import { Perfil } from '@/domain/enums';
import { NAVEGACAO } from '@/presentation/app/layout/navigation';
@Component({
  selector: 'arena-app',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DialogComponent],
  template: `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="shell-header">
      <a class="brand" [routerLink]="state.home()"
        ><img src="/assets/ottawa-tech-simbolo.jpg" alt="Ottawa Tech" width="44" height="44" /><span
          >Arena Beach Tennis<small>Ottawa Tech</small></span
        ></a
      >
      @if (state.session(); as session) {
        <div class="actions">
          <span
            >{{ session.usuario.nome }} <small>{{ session.usuario.perfil }}</small></span
          >
          @if (mock) {
            @for (role of roles; track role) {
              <button
                class="btn"
                [attr.aria-pressed]="session.usuario.perfil === role"
                [disabled]="switching()"
                (click)="switchRole(role)"
              >
                {{ role === 'Administrador' ? 'Admin' : 'Cliente' }}
              </button>
            }
          }
          <button class="btn" (click)="state.logout()">Sair</button>
        </div>
      }
    </header>
    @if (state.session(); as session) {
      <nav class="main-nav" aria-label="Navegação principal">
        @for (item of navigation[session.usuario.perfil]; track item.to) {
          <a [routerLink]="item.to" routerLinkActive="active" ariaCurrentWhenActive="page">{{
            item.label
          }}</a>
        }
      </nav>
    }
    <main id="conteudo" tabindex="-1">
      @if (state.fatalError()) {
        <section class="card" role="alert">
          <h1>Não foi possível exibir esta página</h1>
          <p>{{ state.fatalError() }}</p>
          <div class="actions">
            <button class="btn btn-primary" (click)="reload()">Recarregar</button
            ><a class="btn" [href]="state.home()">Voltar ao início</a>
          </div>
        </section>
      } @else {
        <router-outlet />
      }
    </main>
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (notice of state.notices(); track notice.id) {
        <div
          class="toast"
          [class.error]="notice.error"
          [attr.role]="notice.error ? 'alert' : 'status'"
        >
          <span>{{ notice.text }}</span
          ><button class="btn" aria-label="Dispensar mensagem" (click)="state.dismiss(notice.id)">
            ×
          </button>
        </div>
      }
    </div>
    @if (state.confirmation(); as question) {
      <arena-dialog [title]="question.title" (closed)="state.answer(false)"
        ><p>{{ question.text }}</p>
        <div class="actions">
          <button autofocus class="btn" (click)="state.answer(false)">Voltar</button
          ><button class="btn btn-danger" (click)="state.answer(true)">Confirmar</button>
        </div></arena-dialog
      >
    }
  `,
})
export class AppComponent {
  readonly state = inject(AppState);
  private router = inject(Router);
  readonly mock = isMockMode;
  readonly navigation = NAVEGACAO;
  readonly roles = [Perfil.Cliente, Perfil.Administrador];
  readonly switching = signal(false);
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationError)
        this.state.fatalError.set('Tente recarregar a página ou volte para o início.');
      if (e instanceof NavigationEnd) document.getElementById('conteudo')?.focus();
    });
  }
  reload() {
    window.location.reload();
  }
  async switchRole(role: Perfil) {
    if (this.switching() || this.state.session()?.usuario.perfil === role) return;
    this.switching.set(true);
    try {
      await this.state.services.auth.login(CONTAS_DEMO[role]);
      await this.router.navigateByUrl(this.state.home());
    } catch (e) {
      this.state.error(e);
    } finally {
      this.switching.set(false);
    }
  }
}
