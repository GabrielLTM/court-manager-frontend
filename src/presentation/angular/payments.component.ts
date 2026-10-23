import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PagamentoDetalhado } from '@/application/dto';
import { METODO_PAGAMENTO_LABEL, STATUS_PAGAMENTO_LABEL } from '@/domain/enums';
import { pagamentoPodeSerConfirmado } from '@/domain/rules';
import {
  FILTROS_PAGAMENTO,
  filtrarPagamentos,
  resumirPagamentos,
  type FiltroPagamento,
} from '@/presentation/features/admin/pagamentos/pagamentos.utils';
import { formatDataHora, formatDataLonga } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { AsyncPage, DialogComponent, PaginationComponent } from './shared';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, PaginationComponent],
  template: `<h1>Pagamentos</h1>
    <div class="stats">
      <article class="card">
        <p>Recebido</p>
        <strong>{{ money(summary.recebido.total) }}</strong
        ><small>{{ summary.recebido.quantidade }} pagamentos</small>
      </article>
      <article class="card">
        <p>A receber</p>
        <strong>{{ money(summary.aReceber.total) }}</strong
        ><small>{{ summary.aReceber.quantidade }} pagamentos</small>
      </article>
      <article class="card">
        <p>Estornado</p>
        <strong>{{ money(summary.estornado.total) }}</strong
        ><small>{{ summary.estornado.quantidade }} pagamentos</small>
      </article>
    </div>
    <div class="toolbar" aria-label="Filtrar pagamentos por status">
      @for (f of filters; track f.value) {
        <button
          class="btn"
          [class.selected]="filter === f.value"
          [attr.aria-pressed]="filter === f.value"
          (click)="filter = f.value; page = 1"
        >
          {{ f.label }}
        </button>
      }
    </div>
    @if (loading()) {
      <p role="status">Carregando pagamentos…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <section class="card">
      <div class="table-scroll">
        <table>
          <caption class="sr-only">
            Pagamentos
          </caption>
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Cliente</th>
              <th>Quadra</th>
              <th>Valor</th>
              <th>Método</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered.slice((page - 1) * 8, page * 8); track p.id) {
              <tr>
                <td>{{ code(p.reservaId) }}</td>
                <td>{{ p.cliente?.nome || '—' }}</td>
                <td>{{ p.quadra?.nome || '—' }}</td>
                <td>{{ money(p.valor) }}</td>
                <td>{{ methodLabels[p.metodo] }}</td>
                <td>
                  <span class="tag">{{ labels[p.status] }}</span>
                </td>
                <td>
                  @if (canConfirm(p)) {
                    <button
                      class="btn btn-primary"
                      [disabled]="busy()"
                      (click)="confirm(p)"
                      [attr.aria-label]="'Confirmar pagamento ' + code(p.reservaId)"
                    >
                      Confirmar
                    </button>
                  } @else {
                    <button
                      class="btn"
                      (click)="receipt.set(p)"
                      [attr.aria-label]="'Recibo ' + code(p.reservaId)"
                    >
                      Recibo
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7">Nenhum pagamento com este status.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <arena-pagination [page]="page" [total]="filtered.length" (changed)="page = $event" />
    </section>
    @if (receipt(); as p) {
      <arena-dialog [title]="'Recibo ' + code(p.reservaId)" (closed)="receipt.set(null)"
        ><dl>
          <dt>Reserva</dt>
          <dd>{{ code(p.reservaId) }}</dd>
          <dt>Cliente</dt>
          <dd>{{ p.cliente?.nome || '—' }}</dd>
          <dt>Quadra</dt>
          <dd>{{ p.quadra?.nome || '—' }}</dd>
          <dt>Data/horário</dt>
          <dd>
            {{
              p.reserva
                ? date(p.reserva.data) + ' · ' + p.reserva.horaInicio + '–' + p.reserva.horaFim
                : '—'
            }}
          </dd>
          <dt>Método</dt>
          <dd>{{ methodLabels[p.metodo] }}</dd>
          <dt>Status</dt>
          <dd>{{ labels[p.status] }}</dd>
          <dt>Valor</dt>
          <dd>{{ money(p.valor) }}</dd>
          @if (p.dataPagamento) {
            <dt>Pago em</dt>
            <dd>{{ dateTime(p.dataPagamento) }}</dd>
          }
        </dl>
        <div class="actions">
          <button autofocus class="btn" (click)="receipt.set(null)">Fechar</button>
        </div></arena-dialog
      >
    }`,
})
export class PaymentsComponent extends AsyncPage {
  payments = signal<PagamentoDetalhado[]>([]);
  receipt = signal<PagamentoDetalhado | null>(null);
  filter: FiltroPagamento = 'todos';
  page = 1;
  readonly filters = FILTROS_PAGAMENTO;
  readonly labels = STATUS_PAGAMENTO_LABEL;
  readonly methodLabels = METODO_PAGAMENTO_LABEL;
  readonly money = formatBRL;
  readonly code = formatCodigoReserva;
  readonly date = formatDataLonga;
  readonly dateTime = formatDataHora;
  readonly canConfirm = pagamentoPodeSerConfirmado;
  constructor() {
    super();
    this.load();
  }
  load() {
    void this.request(
      () => this.services.pagamentos.listar(),
      (p) => this.payments.set(p),
    );
  }
  get filtered() {
    return filtrarPagamentos(this.payments(), this.filter);
  }
  get summary() {
    return resumirPagamentos(this.payments());
  }
  async confirm(p: PagamentoDetalhado) {
    if (
      !(await this.state.ask(
        'Confirmar recebimento?',
        this.code(p.reservaId) +
          ' · ' +
          this.money(p.valor) +
          ' em ' +
          this.methodLabels[p.metodo] +
          '. Confirme somente após receber o valor.',
      ))
    )
      return;
    await this.mutate(
      () => this.services.pagamentos.confirmar(p.id),
      () => {
        this.state.notify('Pagamento ' + this.code(p.reservaId) + ' confirmado');
        this.load();
      },
    );
  }
}
