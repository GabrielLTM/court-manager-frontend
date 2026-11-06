import { Component, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Cliente } from '@/core/domain/entities';
import type { ReservaDetalhada } from '@/core/application/dto';
import { StatusCliente, STATUS_CLIENTE_LABEL } from '@/core/domain/enums';
import { clienteNovoSchema, clienteEdicaoSchema, type ClienteFormValues } from './clientes.schemas';
import {
  filtrarClientes,
  clienteParaForm,
  formParaNovoCliente,
  formParaAtualizarCliente,
  contarReservasPorCliente,
  type FiltroStatusCliente,
} from './clientes.utils';
import { AsyncPage } from '@/shared/ui/async-page';
import { CLIENT_FIELDS } from './clientes.fields';
import { DialogComponent } from '@/shared/ui/dialog';
import { EditorComponent } from '@/shared/ui/editor';
import { PaginationComponent } from '@/shared/ui/pagination';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, EditorComponent, PaginationComponent],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class ClientesComponent extends AsyncPage {
  clients = signal<Cliente[]>([]);
  reservations = signal<ReservaDetalhada[]>([]);
  editing = signal<Cliente | null | undefined>(undefined);
  form = signal<Record<string, string>>({});
  query = '';
  filter: FiltroStatusCliente = 'todos';
  page = 1;
  readonly labels = STATUS_CLIENTE_LABEL;
  readonly cpf = maskCpf;
  readonly phone = maskTelefone;
  readonly newSchema = clienteNovoSchema;
  readonly editSchema = clienteEdicaoSchema;
  readonly fields = [
    ...CLIENT_FIELDS,
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '1', label: 'Ativo' },
        { value: '2', label: 'Inativo' },
      ],
    },
  ];
  @ViewChild(EditorComponent) editor?: EditorComponent;
  constructor() {
    super();
    this.load();
  }
  load() {
    void this.request(
      () => Promise.all([this.services.clientes.listar(), this.services.reservas.listar()]),
      ([clients, reservations]) => {
        this.clients.set(clients);
        this.reservations.set(reservations);
      },
    );
  }
  get filtered() {
    return filtrarClientes(this.clients(), { busca: this.query, status: this.filter });
  }
  get counts() {
    return contarReservasPorCliente(this.reservations());
  }
  edit(client: Cliente | null) {
    this.editing.set(client);
    this.form.set({ ...clienteParaForm(client) });
  }
  async close() {
    if (!this.busy() && (await this.canLeave())) this.editing.set(undefined);
  }
  canLeave() {
    return this.editor?.canLeave() ?? true;
  }
  async toggle(c: Cliente) {
    const status = c.status === 1 ? StatusCliente.Inativo : StatusCliente.Ativo;
    if (
      status === StatusCliente.Inativo &&
      !(await this.state.ask(
        'Inativar cliente?',
        c.nome + ' não poderá entrar nem criar reservas. O histórico será preservado.',
      ))
    )
      return;
    await this.mutate(
      () => this.services.clientes.alterarStatus(c.id, status),
      () => {
        this.state.notify('Status do cliente atualizado');
        this.load();
      },
    );
  }
  async save(v: Record<string, string>) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const c = this.editing();
      const values = v as unknown as ClienteFormValues;
      if (c) await this.services.clientes.atualizar(c.id, formParaAtualizarCliente(values));
      else await this.services.clientes.criar(formParaNovoCliente(values));
      this.editing.set(undefined);
      this.state.notify(c ? 'Cliente atualizado' : 'Cliente cadastrado');
      this.load();
    } catch (e) {
      this.editor?.serverError(e);
      this.state.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
