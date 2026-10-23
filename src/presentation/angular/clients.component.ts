import { Component, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Cliente } from '@/domain/entities';
import type { ReservaDetalhada } from '@/application/dto';
import { StatusCliente, STATUS_CLIENTE_LABEL } from '@/domain/enums';
import {
  clienteNovoSchema,
  clienteEdicaoSchema,
  type ClienteFormValues,
} from '@/presentation/validation/schemas';
import {
  filtrarClientes,
  clienteParaForm,
  formParaNovoCliente,
  formParaAtualizarCliente,
  contarReservasPorCliente,
  type FiltroStatusCliente,
} from '@/presentation/features/admin/clientes/clientes.utils';
import {
  AsyncPage,
  CLIENT_FIELDS,
  DialogComponent,
  EditorComponent,
  PaginationComponent,
} from './shared';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, EditorComponent, PaginationComponent],
  template: `
    <div class="page-heading">
      <h1>Clientes</h1>
      <button class="btn btn-primary" (click)="edit(null)">+ Novo cliente</button>
    </div>
    <div class="toolbar">
      <label for="client-search">Buscar clientes</label
      ><input
        #search
        id="client-search"
        type="search"
        placeholder="Nome, CPF ou e-mail"
        [(ngModel)]="query"
        (ngModelChange)="page = 1"
      />
      @if (query) {
        <button
          class="btn"
          aria-label="Limpar busca"
          (click)="query = ''; page = 1; search.focus()"
        >
          ×
        </button>
      }
      <label for="client-status">Status</label
      ><select id="client-status" [(ngModel)]="filter" (ngModelChange)="page = 1">
        <option value="todos">Todos</option>
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
      </select>
    </div>
    @if (loading()) {
      <p role="status">Carregando clientes…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <section class="card">
      <div class="table-scroll">
        <table>
          <caption class="sr-only">
            Clientes
          </caption>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Reservas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered.slice((page - 1) * 8, page * 8); track c.id) {
              <tr>
                <td>{{ c.nome }}</td>
                <td>{{ cpf(c.cpf) }}</td>
                <td>{{ c.email }}<br />{{ phone(c.telefone) }}</td>
                <td>
                  <span class="tag">{{ labels[c.status] }}</span>
                </td>
                <td>{{ counts.get(c.id) || 0 }}</td>
                <td>
                  <div class="actions">
                    <button class="btn" [attr.aria-label]="'Editar ' + c.nome" (click)="edit(c)">
                      Editar</button
                    ><button class="btn" [disabled]="busy()" (click)="toggle(c)">
                      {{ c.status === 1 ? 'Inativar' : 'Reativar' }}
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">Nenhum cliente encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <arena-pagination [page]="page" [total]="filtered.length" (changed)="page = $event" />
    </section>
    @if (editing() !== undefined) {
      <arena-dialog
        [title]="editing() ? 'Editar cliente' : 'Novo cliente'"
        [busy]="busy()"
        (closed)="close()"
        ><arena-form
          [fields]="fields"
          [schema]="editing() ? editSchema : newSchema"
          [initial]="form()"
          [busy]="busy()"
          [submitLabel]="editing() ? 'Salvar alterações' : 'Cadastrar cliente'"
          (saved)="save($event)"
      /></arena-dialog>
    }
  `,
})
export class ClientsComponent extends AsyncPage {
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
