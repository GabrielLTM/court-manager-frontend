import { Component, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EditorComponent } from '@/shared/ui/editor';
import { CLIENT_FIELDS, emptyClient } from '@/features/clientes/clientes.fields';
import { AppState } from '@/app/app-state';
import { cadastroSchema, loginSchema } from './auth.schemas';
import { CONTAS_DEMO } from '@/config/demo';
import { isMockMode } from '@/config/env';
import { destinoAposLogin } from '@/app/guards/access';
@Component({
  selector: 'arena-auth',
  standalone: true,
  imports: [EditorComponent, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
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
