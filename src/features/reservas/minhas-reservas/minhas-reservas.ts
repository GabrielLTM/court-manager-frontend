import { Component, DestroyRef, inject, signal } from '@angular/core';
import type { ReservaDetalhada } from '@/core/application/dto';
import {
  MetodoPagamento,
  METODO_PAGAMENTO_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_RESERVA_LABEL,
  Perfil,
} from '@/core/domain/enums';
import { podeCancelarReserva, statusEfetivoDaReserva } from '@/core/domain/rules';
import {
  calcularEstatisticas,
  ordenarReservas,
  podePagar,
  mensagemPagamentoRegistrado,
  mensagemReservaCancelada,
  destinoDoPagamentoAoCancelar,
  formatHorasJogadas,
} from './minhasReservas.utils';
import { formatDataLonga } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { ajudaMetodoPagamento } from '@/features/pagamentos/ajudaMetodoPagamento';
import { FormsModule } from '@angular/forms';
import { AsyncPage } from '@/shared/ui/async-page';
import { DialogComponent } from '@/shared/ui/dialog';
import { PaginationComponent } from '@/shared/ui/pagination';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, PaginationComponent],
  templateUrl: './minhas-reservas.html',
})
export class MinhasReservasComponent extends AsyncPage {
  reservations = signal<ReservaDetalhada[]>([]);
  paying = signal<ReservaDetalhada | null>(null);
  now = signal(this.services.clock.now());
  page = 1;
  method: MetodoPagamento = MetodoPagamento.Pix;
  readonly methods = [MetodoPagamento.Pix, MetodoPagamento.Cartao, MetodoPagamento.Dinheiro];
  readonly methodLabels = METODO_PAGAMENTO_LABEL;
  readonly paymentLabels = STATUS_PAGAMENTO_LABEL;
  readonly reserveLabels = STATUS_RESERVA_LABEL;
  readonly effective = statusEfetivoDaReserva;
  readonly canPay = podePagar;
  readonly money = formatBRL;
  readonly date = formatDataLonga;
  readonly code = formatCodigoReserva;
  readonly hours = formatHorasJogadas;
  readonly help = ajudaMetodoPagamento;
  constructor() {
    super();
    this.load();
    const tick = setInterval(() => this.now.set(this.services.clock.now()), 30000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }
  load() {
    void this.request(
      () => this.services.reservas.listar(),
      (r) => this.reservations.set(r),
    );
  }
  get stats() {
    return calcularEstatisticas(this.reservations(), this.now());
  }
  get ordered() {
    return ordenarReservas(this.reservations(), this.now());
  }
  canCancel(r: ReservaDetalhada) {
    return podeCancelarReserva(r, this.now(), Perfil.Cliente).permitido;
  }
  async cancel(r: ReservaDetalhada) {
    if (
      !(await this.state.ask(
        'Cancelar reserva ' + this.code(r.id) + '?',
        `${r.quadra?.nome} · ${this.date(r.data)} · ${r.horaInicio}–${r.horaFim}. Pagamento: ${destinoDoPagamentoAoCancelar(r.pagamento)}. O horário será liberado.`,
      ))
    )
      return;
    await this.mutate(
      () => this.services.reservas.cancelar(r.id),
      () => {
        this.state.notify(mensagemReservaCancelada(r.id));
        this.load();
      },
    );
  }
  async pay() {
    const r = this.paying();
    if (!r) return;
    await this.mutate(
      async () => {
        const p = await this.services.pagamentos.registrar({
          reservaId: r.id,
          metodo: this.method,
        });
        this.state.notify(mensagemPagamentoRegistrado(p));
      },
      () => {
        this.paying.set(null);
        this.load();
      },
    );
  }
}
