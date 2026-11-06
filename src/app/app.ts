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
import { AppState } from './app-state';
import { DialogComponent } from '@/shared/ui/dialog';
import { CONTAS_DEMO } from '@/config/demo';
import { isMockMode } from '@/config/env';
import { Perfil } from '@/core/domain/enums';
import { NAVEGACAO } from '@/app/layout/navigation';
@Component({
  selector: 'arena-app',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
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
