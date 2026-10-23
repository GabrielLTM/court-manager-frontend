import { Component, ViewChild, signal } from '@angular/core';
import type { Quadra } from '@/domain/entities';
import { STATUS_QUADRA_LABEL, type StatusQuadra } from '@/domain/enums';
import { quadraSchema, type QuadraFormValues } from '@/presentation/validation/schemas';
import {
  quadraParaForm,
  formParaQuadraInput,
  ACOES_STATUS_QUADRA,
  sugerirNomeQuadra,
} from '@/presentation/features/admin/quadras/quadras.utils';
import { formatBRL } from '@/shared/lib/format';
import { AsyncPage, DialogComponent, EditorComponent, type Field } from './shared';
@Component({
  standalone: true,
  imports: [DialogComponent, EditorComponent],
  template: `<div class="page-heading">
      <h1>Quadras</h1>
      <button class="btn btn-primary" (click)="edit(null)">+ Nova quadra</button>
    </div>
    @if (loading()) {
      <p role="status">Carregando quadras…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <div class="card-grid">
      @for (q of courts(); track q.id) {
        <article class="card">
          <p class="kicker">{{ q.tipo }}</p>
          <h2>{{ q.nome }}</h2>
          <span class="tag">{{ labels[q.status] }}</span>
          <p class="price">{{ money(q.valorHora) }} <small>/ hora</small></p>
          <div class="court-art small" aria-hidden="true"><div></div></div>
          <button class="btn" (click)="edit(q)" [attr.aria-label]="'Editar ' + q.nome">
            Editar
          </button>
          <div class="actions">
            @for (a of actions; track a.status) {
              <button
                class="btn"
                [disabled]="busy() || q.status === a.status"
                (click)="status(q, a.status)"
              >
                {{ a.rotulo }}
              </button>
            }
          </div>
        </article>
      } @empty {
        <p>Nenhuma quadra cadastrada.</p>
      }
    </div>
    @if (editing() !== undefined) {
      <arena-dialog
        [title]="editing() ? 'Editar ' + editing()!.nome : 'Nova quadra'"
        [busy]="busy()"
        (closed)="close()"
        ><arena-form
          [fields]="fields"
          [schema]="schema"
          [initial]="form()"
          [busy]="busy()"
          [submitLabel]="editing() ? 'Salvar alterações' : 'Cadastrar quadra'"
          (saved)="save($event)"
      /></arena-dialog>
    }`,
})
export class CourtsComponent extends AsyncPage {
  courts = signal<Quadra[]>([]);
  editing = signal<Quadra | null | undefined>(undefined);
  form = signal<Record<string, string>>({});
  readonly schema = quadraSchema;
  readonly labels = STATUS_QUADRA_LABEL;
  readonly money = formatBRL;
  readonly actions = ACOES_STATUS_QUADRA;
  fields: Field[] = [
    { key: 'nome', label: 'Identificação' },
    { key: 'tipo', label: 'Tipo', placeholder: 'Beach Tennis' },
    { key: 'valorHora', label: 'Valor por hora (R$)', placeholder: '80,00' },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '1', label: 'Ativa' },
        { value: '3', label: 'Manutenção' },
        { value: '2', label: 'Inativa' },
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
      () => this.services.quadras.listar(),
      (courts) => this.courts.set(courts),
    );
  }
  edit(court: Quadra | null) {
    this.editing.set(court);
    this.fields = this.fields.map((f) =>
      f.key === 'nome' ? { ...f, placeholder: sugerirNomeQuadra(this.courts()) } : f,
    );
    this.form.set({ ...quadraParaForm(court) });
  }
  canLeave() {
    return this.editor?.canLeave() ?? true;
  }
  async close() {
    if (!this.busy() && (await this.canLeave())) this.editing.set(undefined);
  }
  async status(q: Quadra, status: StatusQuadra) {
    await this.mutate(
      () => this.services.quadras.alterarStatus(q.id, status),
      () => {
        this.state.notify(q.nome + ' — ' + this.labels[status]);
        this.load();
      },
    );
  }
  async save(v: Record<string, string>) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const q = this.editing();
      const input = formParaQuadraInput(v as unknown as QuadraFormValues);
      if (q) await this.services.quadras.atualizar(q.id, input);
      else await this.services.quadras.criar(input);
      this.editing.set(undefined);
      this.state.notify(q ? 'Quadra atualizada' : 'Quadra cadastrada');
      this.load();
    } catch (e) {
      this.editor?.serverError(e);
      this.state.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
