import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ReservaDetalhada } from '@/application/dto';
import type { Quadra } from '@/domain/entities';
import {
  METODO_PAGAMENTO_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_RESERVA_LABEL,
} from '@/domain/enums';
import {
  montarGrade,
  contarReservasAtivas,
  type CelulaGrade,
} from '@/presentation/features/admin/grade/grade.utils';
import {
  acoesDaReserva,
  avisoDoPagamentoAoCancelar,
} from '@/presentation/features/admin/grade/reserva.utils';
import { formatDataLonga, toISODate, addDays } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { AsyncPage, DialogComponent } from './shared';
import { BookingComponent } from './booking.component';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, BookingComponent],
  template: `<div class="page-heading">
      <h1>Grade de reservas</h1>
      <div class="actions">
        <button class="btn" aria-label="Dia anterior" (click)="changeDay(-1)">←</button
        ><label for="grade-date">Data</label
        ><input id="grade-date" type="date" [(ngModel)]="date" (ngModelChange)="load()" /><button
          class="btn"
          aria-label="Próximo dia"
          (click)="changeDay(1)"
        >
          →
        </button>
      </div>
    </div>
    <p>{{ count }} reservas · {{ longDate(date) }}</p>
    <div class="actions legend">
      <span>Livre</span><span class="tag">Reservada · paga</span
      ><span class="tag warning">Pagamento pendente</span><span>— Indisponível</span>
    </div>
    @if (loading()) {
      <p role="status">Carregando grade…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <section class="card table-scroll">
      <table class="grade">
        <caption class="sr-only">
          Grade de reservas
        </caption>
        <thead>
          <tr>
            <th>Horário</th>
            @for (q of courts(); track q.id) {
              <th>{{ q.nome }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.hora) {
            <tr>
              <th>{{ row.hora }}</th>
              @for (cell of row.celulas; track cell.quadra.id) {
                <td>
                  <button
                    class="grade-cell"
                    [class.reserved]="cell.tipo === 'reservada'"
                    [class.unavailable]="cell.tipo === 'indisponivel'"
                    [class.warning]="cell.tipo === 'reservada' && !cell.pago"
                    [attr.aria-label]="cell.descricao"
                    [title]="cell.descricao"
                    (click)="select(cell)"
                  >
                    {{ cell.rotulo || 'Livre' }}
                  </button>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (!courts().length && !loading()) {
        <p>Nenhuma quadra cadastrada.</p>
      }
    </section>
    @if (selected(); as r) {
      <arena-dialog
        [title]="editing() ? 'Alterar ' + code(r.id) : code(r.id)"
        [busy]="busy()"
        (closed)="selected.set(null); editing.set(false)"
      >
        @if (editing()) {
          <arena-booking
            [reservation]="r"
            (saved)="selected.set(null); editing.set(false); load()"
          />
        } @else {
          <dl>
            <dt>Cliente</dt>
            <dd>{{ r.cliente?.nome || '—' }}</dd>
            <dt>Quadra</dt>
            <dd>{{ r.quadra?.nome || '—' }}</dd>
            <dt>Horário</dt>
            <dd>{{ longDate(r.data) }} · {{ r.horaInicio }}–{{ r.horaFim }}</dd>
            <dt>Valor</dt>
            <dd>{{ money(r.valor) }}</dd>
            <dt>Pagamento</dt>
            <dd>
              {{
                r.pagamento
                  ? paymentLabels[r.pagamento.status] + ' · ' + methodLabels[r.pagamento.metodo]
                  : 'Sem pagamento'
              }}
            </dd>
            <dt>Status</dt>
            <dd>{{ labels[actions(r).status] }}</dd>
          </dl>
          <div class="actions">
            <button autofocus class="btn" [disabled]="busy()" (click)="selected.set(null)">
              Fechar
            </button>
            @if (actions(r).podeAlterar) {
              <button class="btn" (click)="editing.set(true)">Alterar</button>
            }
            @if (actions(r).podeCancelar) {
              <button class="btn btn-danger" [disabled]="busy()" (click)="cancel(r)">
                Cancelar reserva
              </button>
            }
          </div>
        }
      </arena-dialog>
    }`,
})
export class GradeComponent extends AsyncPage {
  date = toISODate(this.services.clock.now());
  courts = signal<Quadra[]>([]);
  reservations = signal<ReservaDetalhada[]>([]);
  selected = signal<ReservaDetalhada | null>(null);
  editing = signal(false);
  readonly labels = STATUS_RESERVA_LABEL;
  readonly paymentLabels = STATUS_PAGAMENTO_LABEL;
  readonly methodLabels = METODO_PAGAMENTO_LABEL;
  readonly code = formatCodigoReserva;
  readonly money = formatBRL;
  readonly longDate = formatDataLonga;
  constructor() {
    super();
    this.load();
  }
  get rows() {
    return montarGrade({ quadras: this.courts(), reservas: this.reservations(), data: this.date });
  }
  get count() {
    return contarReservasAtivas(this.reservations(), this.date);
  }
  load() {
    if (this.date)
      void this.request(
        () =>
          Promise.all([
            this.services.quadras.listar(),
            this.services.reservas.listar({ data: this.date }),
          ]),
        ([q, r]) => {
          this.courts.set(q);
          this.reservations.set(r);
        },
      );
  }
  changeDay(offset: number) {
    this.date = addDays(this.date, offset);
    this.load();
  }
  select(cell: CelulaGrade) {
    if (cell.tipo === 'reservada') this.selected.set(cell.reserva);
    else this.state.notify(cell.mensagem);
  }
  actions(r: ReservaDetalhada) {
    return acoesDaReserva(r, this.services.clock.now());
  }
  async cancel(r: ReservaDetalhada) {
    if (
      !(await this.state.ask(
        'Cancelar reserva ' + this.code(r.id) + '?',
        r.cliente?.nome +
          ' · ' +
          r.quadra?.nome +
          '. ' +
          avisoDoPagamentoAoCancelar(r.pagamento) +
          ' O horário será liberado.',
      ))
    )
      return;
    await this.mutate(
      () => this.services.reservas.cancelar(r.id),
      () => {
        this.selected.set(null);
        this.state.notify('Reserva cancelada — horário liberado');
        this.load();
      },
    );
  }
}
