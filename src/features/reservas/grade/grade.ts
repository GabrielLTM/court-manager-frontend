import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ReservaDetalhada } from '@/core/application/dto';
import type { Quadra } from '@/core/domain/entities';
import {
  METODO_PAGAMENTO_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_RESERVA_LABEL,
} from '@/core/domain/enums';
import { montarGrade, contarReservasAtivas, type CelulaGrade } from './grade.utils';
import { acoesDaReserva, avisoDoPagamentoAoCancelar } from './reserva.utils';
import { formatDataLonga, toISODate, addDays } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { AsyncPage } from '@/shared/ui/async-page';
import { DialogComponent } from '@/shared/ui/dialog';
import { ReservarComponent } from '../reservar/reservar';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, ReservarComponent],
  templateUrl: './grade.html',
  styleUrl: './grade.css',
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
