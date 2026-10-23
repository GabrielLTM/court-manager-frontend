import { Component, ViewChild, signal } from '@angular/core';
import { AsyncPage, CLIENT_FIELDS, EditorComponent, emptyClient } from './shared';
import { perfilSchema } from '@/presentation/validation/schemas';
@Component({
  standalone: true,
  imports: [EditorComponent],
  template: `<h1>Meus dados</h1>
    @if (loading()) {
      <p role="status">Carregando cadastro…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    @if (initial(); as data) {
      <section class="card">
        <p class="kicker">Seu cadastro</p>
        <h2>Atualizar seus dados</h2>
        <p>Mantenha seus dados de contato em dia. Deixe a senha vazia para manter a atual.</p>
        <arena-form
          [fields]="fields"
          [schema]="schema"
          [initial]="data"
          [busy]="busy()"
          (saved)="save($event)"
        />
      </section>
    }`,
})
export class ProfileComponent extends AsyncPage {
  readonly fields = CLIENT_FIELDS;
  readonly schema = perfilSchema;
  initial = signal<Record<string, string> | null>(null);
  @ViewChild(EditorComponent) editor?: EditorComponent;
  constructor() {
    super();
    this.load();
  }
  load() {
    void this.request(
      () => this.services.perfil.obter(),
      (c) =>
        this.initial.set({
          ...emptyClient(),
          nome: c.nome,
          cpf: c.cpf,
          telefone: c.telefone,
          email: c.email,
          dataNascimento: c.dataNascimento ?? '',
          senha: '',
          status: String(c.status),
        }),
    );
  }
  canLeave() {
    return this.editor?.canLeave() ?? true;
  }
  async save(v: Record<string, string>) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const c = await this.services.perfil.atualizar({
        nome: v['nome'],
        cpf: v['cpf'],
        telefone: v['telefone'],
        email: v['email'],
        dataNascimento: v['dataNascimento'] || null,
        ...(v['senha'] ? { senha: v['senha'] } : {}),
      });
      this.initial.set({
        ...emptyClient(),
        nome: c.nome,
        cpf: c.cpf,
        telefone: c.telefone,
        email: c.email,
        dataNascimento: c.dataNascimento ?? '',
        senha: '',
        status: String(c.status),
      });
      this.state.notify('Dados atualizados');
    } catch (e) {
      this.editor?.serverError(e);
      this.state.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
