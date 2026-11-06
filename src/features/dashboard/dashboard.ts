import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ResumoDashboard } from '@/core/application/dto';
import { montarIndicadores } from './dashboard.utils';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { formatDataCurta, toISODate } from '@/shared/lib/date';
import { STATUS_RESERVA_LABEL } from '@/core/domain/enums';
import { statusEfetivoDaReserva } from '@/core/domain/rules';
import { AsyncPage } from '@/shared/ui/async-page';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent extends AsyncPage {
  date = toISODate(this.services.clock.now());
  summary = signal<ResumoDashboard | null>(null);
  readonly now = this.services.clock.now();
  readonly indicators = montarIndicadores;
  readonly shortDate = formatDataCurta;
  readonly code = formatCodigoReserva;
  readonly money = formatBRL;
  readonly labels = STATUS_RESERVA_LABEL;
  readonly effective = statusEfetivoDaReserva;
  constructor() {
    super();
    this.load();
  }
  load() {
    if (this.date)
      void this.request(
        () => this.services.dashboard.obterResumo(this.date),
        (s) => this.summary.set(s),
      );
  }
}
