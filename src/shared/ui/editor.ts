import { Component, ElementRef, HostListener, Input, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { z } from 'zod';
import { AppState } from '@/app/app-state';
import { isAppError } from '@/core/application/errors';
import { isDomainError } from '@/core/domain/errors/DomainError';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
import { getErrorMessage } from './errors';
export interface Field {
  key: string;
  label: string;
  type?: string;
  autocomplete?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
@Component({
  selector: 'arena-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
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
