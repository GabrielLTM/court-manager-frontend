import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { z } from 'zod';
import { AppState } from './state';
import { isAppError } from '@/application/errors';
import { isDomainError } from '@/domain/errors/DomainError';
import { getErrorMessage } from '@/presentation/lib/errors';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
export interface Field {
  key: string;
  label: string;
  type?: string;
  autocomplete?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
@Component({
  selector: 'arena-dialog',
  standalone: true,
  template: `<dialog #dialog [attr.aria-labelledby]="titleId" (cancel)="cancel($event)">
    <div class="dialog-head">
      <h2 [id]="titleId">{{ title }}</h2>
      <button
        type="button"
        class="btn"
        aria-label="Fechar diálogo"
        [disabled]="busy"
        (click)="closed.emit()"
      >
        ×
      </button>
    </div>
    <ng-content />
  </dialog>`,
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  readonly titleId = 'dialog-' + Math.random().toString(36).slice(2);
  @Input() title = '';
  @Input() busy = false;
  closed = output<void>();
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  private previous = document.activeElement as HTMLElement | null;
  private overflow = '';
  ngAfterViewInit() {
    this.overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.dialog.nativeElement.showModal();
  }
  cancel(event: Event) {
    event.preventDefault();
    if (!this.busy) this.closed.emit();
  }
  ngOnDestroy() {
    this.dialog.nativeElement.close();
    document.body.style.overflow = this.overflow;
    this.previous?.focus();
  }
}
@Component({
  selector: 'arena-form',
  standalone: true,
  imports: [FormsModule],
  template: ` <form novalidate (ngSubmit)="submit()" [attr.aria-label]="label" class="editor">
    @if (formError()) {
      <p role="alert" class="field-error">{{ formError() }}</p>
    }
    @for (field of fields; track field.key) {
      <div class="field">
        <label [for]="prefix + field.key">{{ field.label }}</label>
        @if (field.options) {
          <select
            [id]="prefix + field.key"
            [name]="field.key"
            [value]="values[field.key]"
            (change)="update(field.key, $any($event.target).value)"
            [disabled]="busy"
            [attr.aria-invalid]="!!errors()[field.key]"
            [attr.aria-describedby]="errors()[field.key] ? prefix + field.key + '-error' : null"
          >
            @for (opt of field.options; track opt.value) {
              <option [value]="opt.value" [selected]="values[field.key] === opt.value">
                {{ opt.label }}
              </option>
            }
          </select>
        } @else {
          <div class="input-row">
            <input
              [id]="prefix + field.key"
              [name]="field.key"
              [type]="field.type === 'password' && reveal() ? 'text' : field.type || 'text'"
              [value]="values[field.key]"
              (input)="update(field.key, $any($event.target).value)"
              [autocomplete]="field.autocomplete || 'off'"
              [placeholder]="field.placeholder || ''"
              [disabled]="busy"
              [attr.aria-invalid]="!!errors()[field.key]"
              [attr.aria-describedby]="errors()[field.key] ? prefix + field.key + '-error' : null"
            />
            @if (field.type === 'password') {
              <button
                class="btn"
                type="button"
                [attr.aria-label]="reveal() ? 'Ocultar senha' : 'Mostrar senha'"
                [attr.aria-pressed]="reveal()"
                (click)="reveal.set(!reveal())"
              >
                {{ reveal() ? 'Ocultar' : 'Mostrar' }}
              </button>
            }
          </div>
        }
        @if (errors()[field.key]) {
          <p class="field-error" [id]="prefix + field.key + '-error'">{{ errors()[field.key] }}</p>
        }
      </div>
    }
    <div class="actions">
      <button type="button" class="btn" [disabled]="busy" (click)="reset()">
        Descartar alterações</button
      ><button class="btn btn-primary" type="submit" [disabled]="busy" [attr.aria-busy]="busy">
        {{ busy ? 'Salvando…' : submitLabel }}
      </button>
    </div>
  </form>`,
})
export class EditorComponent {
  @Input() fields: Field[] = [];
  @Input() label = 'Formulário';
  @Input() submitLabel = 'Salvar alterações';
  @Input() schema!: z.ZodType;
  @Input() busy = false;
  @Input() set initial(value: Record<string, string>) {
    const normalized = Object.fromEntries(
      Object.entries(value).map(([key, text]) => [
        key,
        key === 'cpf' ? maskCpf(text) : key === 'telefone' ? maskTelefone(text) : text,
      ]),
    );
    this.original = { ...normalized };
    this.values = { ...normalized };
    this.formError.set('');
    this.errors.set({});
  }
  private original: Record<string, string> = {};
  values: Record<string, string> = {};
  readonly prefix = 'field-' + Math.random().toString(36).slice(2) + '-';
  formError = signal('');
  errors = signal<Record<string, string>>({});
  reveal = signal(false);
  saved = output<Record<string, string>>();
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private state = inject(AppState);
  update(key: string, value: string) {
    this.values[key] =
      key === 'cpf' ? maskCpf(value) : key === 'telefone' ? maskTelefone(value) : value;
  }
  dirty() {
    return JSON.stringify(this.original) !== JSON.stringify(this.values);
  }
  reset() {
    this.values = { ...this.original };
    this.errors.set({});
    this.formError.set('');
  }
  @HostListener('window:beforeunload', ['$event']) unload(event: BeforeUnloadEvent) {
    if (this.dirty()) {
      event.preventDefault();
    }
  }
  async canLeave() {
    return (
      !this.dirty() ||
      (await this.state.ask('Descartar alterações?', 'Os dados não salvos serão perdidos.'))
    );
  }
  submit() {
    if (this.busy) return;
    this.formError.set('');
    const result = this.schema.safeParse(this.values);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errors[key] ??= issue.message;
      }
      this.errors.set(errors);
      this.focusError();
      return;
    }
    this.errors.set({});
    this.saved.emit(result.data as Record<string, string>);
  }
  serverError(error: unknown) {
    this.formError.set(getErrorMessage(error));
    const errors: Record<string, string> = {};
    const normalize = (key: string) => key.replace(/[^a-z]/gi, '').toLowerCase();
    if (isAppError(error) && error.fieldErrors)
      for (const [key, value] of Object.entries(error.fieldErrors)) {
        const field = this.fields.find((f) => normalize(f.key) === normalize(key));
        if (field && value[0]) errors[field.key] = value[0];
      }
    if (isDomainError(error)) {
      const key = error.regra === 'RN01' ? 'cpf' : error.regra === 'RN02' ? 'email' : null;
      if (key && this.fields.some((f) => f.key === key)) errors[key] = error.message;
    }
    this.errors.set(errors);
    this.focusError();
  }
  private focusError() {
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
  }
}
export const CLIENT_FIELDS: Field[] = [
  { key: 'nome', label: 'Nome completo', autocomplete: 'name' },
  { key: 'cpf', label: 'CPF' },
  { key: 'dataNascimento', label: 'Data de nascimento', type: 'date', autocomplete: 'bday' },
  { key: 'telefone', label: 'Telefone', type: 'tel', autocomplete: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email', autocomplete: 'email' },
  { key: 'senha', label: 'Senha', type: 'password', autocomplete: 'new-password' },
];
export const emptyClient = () => ({
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  senha: '',
  status: '1',
});
@Component({
  selector: 'arena-pagination',
  standalone: true,
  template: `<nav class="pagination" aria-label="Paginação">
    <span>{{ total }} registros · Página {{ page }} de {{ count }}</span
    ><button class="btn" [disabled]="page <= 1" (click)="changed.emit(page - 1)">Anterior</button
    ><button class="btn" [disabled]="page >= count" (click)="changed.emit(page + 1)">
      Próxima
    </button>
  </nav>`,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() size = 8;
  changed = output<number>();
  get count() {
    return Math.max(1, Math.ceil(this.total / this.size));
  }
}
/** Each page owns its requests; destroyed or superseded requests cannot overwrite the new page. */
export abstract class AsyncPage {
  protected state = inject(AppState);
  protected services = this.state.services;
  loading = signal(false);
  error = signal('');
  busy = signal(false);
  private generation = 0;
  protected destroyed = false;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.generation++;
    });
  }
  async request<T>(operation: () => Promise<T>, apply: (data: T) => void) {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await operation();
      if (!this.destroyed && generation === this.generation) apply(result);
    } catch (error) {
      if (!this.destroyed && generation === this.generation) {
        this.error.set(
          error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
        );
      }
    } finally {
      if (!this.destroyed && generation === this.generation) this.loading.set(false);
    }
  }
  async mutate(operation: () => Promise<unknown>, success: () => void) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await operation();
      if (!this.destroyed) success();
    } catch (error) {
      this.state.error(error);
    } finally {
      this.busy.set(false);
    }
  }
}
