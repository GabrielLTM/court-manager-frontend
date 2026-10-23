import { Component, DestroyRef, inject, signal } from '@angular/core';
import type { ReservaDetalhada } from '@/application/dto';
import {
  MetodoPagamento,
  METODO_PAGAMENTO_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_RESERVA_LABEL,
  Perfil,
} from '@/domain/enums';
import { podeCancelarReserva, statusEfetivoDaReserva } from '@/domain/rules';
import {
  calcularEstatisticas,
  ordenarReservas,
  podePagar,
  mensagemPagamentoRegistrado,
  mensagemReservaCancelada,
  destinoDoPagamentoAoCancelar,
  formatHorasJogadas,
} from '@/presentation/features/minhas-reservas/minhasReservas.utils';
import { formatDataLonga } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { ajudaMetodoPagamento } from '@/presentation/components/MetodoPagamentoPicker/ajudaMetodoPagamento';
import { FormsModule } from '@angular/forms';
import { AsyncPage, DialogComponent, PaginationComponent } from './shared';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, PaginationComponent],
  template: `<h1>Minhas reservas</h1>
    <div class="stats">
      <article class="card">
        <p>Próximas reservas</p>
        <strong>{{ stats.proximasReservas }}</strong>
      </article>
      <article class="card">
        <p>Pagamentos pendentes</p>
        <strong>{{ stats.pagamentosPendentes }}</strong>
      </article>
      <article class="card">
        <p>Horas jogadas no mês</p>
        <strong>{{ hours(stats.minutosJogadosNoMes) }}</strong>
      </article>
    </div>
    @if (loading()) {
      <p role="status">Carregando reservas…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <section class="card">
      <div class="table-scroll">
        <table>
          <caption class="sr-only">
            Minhas reservas
          </caption>
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Data</th>
              <th>Quadra</th>
              <th>Horário</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (r of ordered.slice((page - 1) * 8, page * 8); track r.id) {
              <tr>
                <td>{{ code(r.id) }}</td>
                <td>{{ date(r.data) }}</td>
                <td>{{ r.quadra?.nome || '—' }}</td>
                <td>{{ r.horaInicio }}–{{ r.horaFim }}</td>
                <td>{{ money(r.valor) }}</td>
                <td>
                  <span class="tag">{{ reserveLabels[effective(r, now())] }}</span>
                </td>
                <td>
                  {{ r.pagamento ? paymentLabels[r.pagamento.status] : 'Sem pagamento'
                  }}<small>{{ r.pagamento ? methodLabels[r.pagamento.metodo] : '' }}</small>
                </td>
                <td>
                  <div class="actions">
                    @if (canPay(r)) {
                      <button class="btn" (click)="paying.set(r)">Pagar</button>
                    }
                    @if (canCancel(r)) {
                      <button class="btn" [disabled]="busy()" (click)="cancel(r)">Cancelar</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8">Você ainda não tem reservas. Escolha uma quadra para começar.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <arena-pagination [page]="page" [total]="ordered.length" (changed)="page = $event" />
    </section>
    @if (paying(); as r) {
      <arena-dialog
        [title]="'Pagar reserva ' + code(r.id)"
        [busy]="busy()"
        (closed)="paying.set(null)"
        ><p>{{ r.quadra?.nome }} · {{ date(r.data) }} · {{ r.horaInicio }}–{{ r.horaFim }}</p>
        <p class="price">{{ money(r.valor) }}</p>
        <label for="pay-method">Método de pagamento</label
        ><select id="pay-method" [(ngModel)]="method" [disabled]="busy()">
          @for (m of methods; track m) {
            <option [ngValue]="m">{{ methodLabels[m] }}</option>
          }
        </select>
        <p>{{ help(method) }}</p>
        <div class="actions">
          <button autofocus class="btn" [disabled]="busy()" (click)="paying.set(null)">
            Voltar</button
          ><button class="btn btn-primary" [disabled]="busy()" (click)="pay()">
            {{ busy() ? 'Pagando…' : 'Confirmar pagamento' }}
          </button>
        </div></arena-dialog
      >
    }`,
})
export class ReservationsComponent extends AsyncPage {
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
