import { Component, ViewChild, signal } from '@angular/core';
import { AsyncPage } from '@/shared/ui/async-page';
import { CLIENT_FIELDS, emptyClient } from './clientes.fields';
import { EditorComponent } from '@/shared/ui/editor';
import { perfilSchema } from './clientes.schemas';
@Component({
  standalone: true,
  imports: [EditorComponent],
  templateUrl: './meus-dados.html',
})
export class MeusDadosComponent extends AsyncPage {
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
