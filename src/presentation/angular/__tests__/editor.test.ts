import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { z } from 'zod';
import { EditorComponent, PaginationComponent } from '../shared';
import { AppState } from '../state';
describe('Angular shared components', () => {
  it('validates before emitting, associates errors, and preserves input', async () => {
    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideRouter([]),
        { provide: AppState, useValue: { ask: vi.fn().mockResolvedValue(true) } },
      ],
    });
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('fields', [{ key: 'email', label: 'E-mail' }]);
    fixture.componentRef.setInput(
      'schema',
      z.object({ email: z.email('Informe um e-mail válido.') }),
    );
    fixture.componentRef.setInput('initial', { email: 'invalid' });
    fixture.detectChanges();
    await fixture.whenStable();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(saved).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Informe um e-mail válido.');
    expect(fixture.componentInstance.values['email']).toBe('invalid');
    fixture.componentInstance.values['email'] = 'cliente@example.com';
    fixture.componentInstance.submit();
    expect(saved).toHaveBeenCalledWith({ email: 'cliente@example.com' });
  });
  it('does not submit while busy and asks before discarding edits', async () => {
    const ask = vi.fn().mockResolvedValue(false);
    TestBed.configureTestingModule({ providers: [{ provide: AppState, useValue: { ask } }] });
    const fixture = TestBed.createComponent(EditorComponent);
    fixture.componentRef.setInput('schema', z.object({ nome: z.string() }));
    fixture.componentRef.setInput('initial', { nome: 'Original' });
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.values['nome'] = 'Alterado';
    expect(await fixture.componentInstance.canLeave()).toBe(false);
    expect(ask).toHaveBeenCalled();
    fixture.componentRef.setInput('busy', true);
    fixture.componentInstance.submit();
    expect(saved).not.toHaveBeenCalled();
    fixture.componentInstance.reset();
    expect(fixture.componentInstance.dirty()).toBe(false);
  });
  it('bounds pagination for empty and multi-page datasets', () => {
    TestBed.configureTestingModule({ imports: [PaginationComponent] });
    const f = TestBed.createComponent(PaginationComponent);
    f.componentRef.setInput('total', 0);
    f.detectChanges();
    expect(f.componentInstance.count).toBe(1);
    const buttons = f.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    f.componentRef.setInput('total', 17);
    f.detectChanges();
    expect(f.componentInstance.count).toBe(3);
  });
});

describe('Angular backend validation mapping', () => {
  it('maps normalized API errors and domain uniqueness to the correct fields', async () => {
    const { AppError } = await import('@/application/errors');
    const { DomainError } = await import('@/domain/errors/DomainError');
    TestBed.configureTestingModule({
      providers: [{ provide: AppState, useValue: { ask: vi.fn() } }],
    });
    const f = TestBed.createComponent(EditorComponent);
    f.componentRef.setInput('fields', [
      { key: 'email', label: 'E-mail' },
      { key: 'cpf', label: 'CPF' },
      { key: 'dataNascimento', label: 'Data de nascimento' },
    ]);
    f.componentRef.setInput('schema', z.object({}));
    f.componentInstance.serverError(
      new AppError('Validation', {
        fieldErrors: { '$.Email': ['E-mail em uso'], DataNascimento: ['Data inválida'] },
      }),
    );
    expect(f.componentInstance.errors()).toEqual({
      email: 'E-mail em uso',
      dataNascimento: 'Data inválida',
    });
    f.componentInstance.serverError(new DomainError('RN01', 'CPF já cadastrado'));
    expect(f.componentInstance.errors()).toEqual({ cpf: 'CPF já cadastrado' });
  });
});
