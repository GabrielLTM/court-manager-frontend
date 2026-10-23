import { Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EditorComponent, CLIENT_FIELDS, emptyClient } from './shared';
import { AppState } from './state';
import { cadastroSchema, loginSchema } from '@/presentation/validation/schemas';
import { CONTAS_DEMO } from '@/config/demo';
import { isMockMode } from '@/config/env';
import { destinoAposLogin } from '@/presentation/app/guards/access';
@Component({
  selector: 'arena-auth',
  standalone: true,
  imports: [EditorComponent, RouterLink],
  template: ` <section class="auth-layout">
    <div class="auth-intro">
      <p class="kicker">Ottawa Tech · Beach Tennis</p>
      <h1>Sua próxima partida começa aqui.</h1>
      <p>Escolha a quadra, reserve seu horário e aproveite a arena.</p>
      <div class="court-art" aria-hidden="true"><div></div></div>
    </div>
    <div class="card auth-card">
      <nav class="tabs" aria-label="Acesso">
        <a routerLink="/login" [attr.aria-current]="!register ? 'page' : null">Entrar</a
        ><a routerLink="/cadastro" [attr.aria-current]="register ? 'page' : null">Criar conta</a>
      </nav>
      <h2>{{ register ? 'Criar conta' : 'Bem-vindo de volta' }}</h2>
      <arena-form
        [fields]="fields"
        [schema]="register ? cadastroSchema : loginSchema"
        [initial]="initial()"
        [busy]="busy()"
        [label]="register ? 'Criar conta' : 'Entrar'"
        [submitLabel]="register ? 'Criar conta e entrar' : 'Entrar'"
        (saved)="submit($event)"
      />
      @if (mock && !register) {
        <p>Acessar como</p>
        <div class="actions">
          @for (account of accounts; track account.email) {
            <button
              class="btn"
              [disabled]="busy()"
              (click)="initial.set({ email: account.email, senha: account.senha })"
            >
              {{ account.rotulo }}
            </button>
          }
        </div>
        <small>Contas de demonstração · dados simulados</small>
      }
    </div>
  </section>`,
})
export class AuthComponent {
  private state = inject(AppState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly register = this.route.snapshot.routeConfig?.path === 'cadastro';
  readonly mock = isMockMode;
  readonly accounts = Object.values(CONTAS_DEMO);
  readonly loginSchema = loginSchema;
  readonly cadastroSchema = cadastroSchema;
  readonly fields = this.register
    ? CLIENT_FIELDS
    : [
        { key: 'email', label: 'E-mail', type: 'email', autocomplete: 'username' },
        { key: 'senha', label: 'Senha', type: 'password', autocomplete: 'current-password' },
      ];
  initial = signal<Record<string, string>>(
    this.register ? emptyClient() : { email: '', senha: '' },
  );
  busy = signal(false);
  @ViewChild(EditorComponent) editor?: EditorComponent;
  canLeave() {
    return this.register ? (this.editor?.canLeave() ?? true) : true;
  }
  async submit(v: Record<string, string>) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const session = this.register
        ? await this.state.services.auth.registrar({
            nome: v['nome'],
            cpf: v['cpf'],
            telefone: v['telefone'],
            email: v['email'],
            senha: v['senha'],
            dataNascimento: v['dataNascimento'] || null,
          })
        : await this.state.services.auth.login({ email: v['email'], senha: v['senha'] });
      this.editor?.reset();
      this.state.notify(this.register ? 'Conta criada!' : 'Login realizado');
      const from = this.route.snapshot.queryParamMap.get('from');
      const origin =
        from?.startsWith('/') && !from.startsWith('//')
          ? new URL(from, 'http://arena.local')
          : null;
      await this.router.navigateByUrl(
        destinoAposLogin(
          {
            from: {
              pathname: origin?.pathname ?? '',
              search: origin?.search ?? '',
              hash: origin?.hash ?? '',
            },
          },
          session.usuario.perfil,
        ),
      );
    } catch (e) {
      this.editor?.serverError(e);
      this.state.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
