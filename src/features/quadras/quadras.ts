import { Component, ViewChild, signal } from '@angular/core';
import type { Quadra } from '@/core/domain/entities';
import { STATUS_QUADRA_LABEL, type StatusQuadra } from '@/core/domain/enums';
import { quadraSchema, type QuadraFormValues } from './quadras.schemas';
import {
  quadraParaForm,
  formParaQuadraInput,
  ACOES_STATUS_QUADRA,
  sugerirNomeQuadra,
} from './quadras.utils';
import { formatBRL } from '@/shared/lib/format';
import { AsyncPage } from '@/shared/ui/async-page';
import { DialogComponent } from '@/shared/ui/dialog';
import { EditorComponent, type Field } from '@/shared/ui/editor';
@Component({
  standalone: true,
  imports: [DialogComponent, EditorComponent],
  templateUrl: './quadras.html',
  styleUrl: './quadras.css',
})
export class QuadrasComponent extends AsyncPage {
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
