import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { ResumoDashboard } from '@/application/dto';
import { montarIndicadores } from '@/presentation/features/admin/dashboard/dashboard.utils';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { formatDataCurta, toISODate } from '@/shared/lib/date';
import { STATUS_RESERVA_LABEL } from '@/domain/enums';
import { statusEfetivoDaReserva } from '@/domain/rules';
import { AsyncPage } from './shared';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `<div class="page-heading">
      <h1>Dashboard</h1>
      <div>
        <label for="dashboard-date">Data</label
        ><input id="dashboard-date" type="date" [(ngModel)]="date" (ngModelChange)="load()" />
      </div>
    </div>
    @if (loading()) {
      <p role="status">Carregando dashboard…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    @if (summary(); as s) {
      <div class="stats">
        @for (i of indicators(s); track i.chave) {
          <article class="card">
            <p>{{ i.rotulo }}</p>
            <strong>{{ i.valor }}</strong
            ><small>{{ i.dica }}</small>
          </article>
        }
      </div>
      <div class="dashboard-layout">
        <section class="card">
          <h2>Ocupação por quadra</h2>
          <p>{{ shortDate(s.data) }} · Horário de funcionamento da arena</p>
          @for (o of s.ocupacao; track o.quadra.id) {
            <div class="occupancy">
              <div class="page-heading">
                <strong>{{ o.quadra.nome }}</strong
                ><span>{{ o.percentual.toFixed(0) }}%</span>
              </div>
              <progress
                max="100"
                [value]="o.percentual"
                [attr.aria-label]="'Ocupação ' + o.quadra.nome"
              ></progress
              ><small>{{ o.minutosReservados }} minutos reservados</small>
            </div>
          } @empty {
            <p>Nenhuma quadra cadastrada.</p>
          }
          <a class="btn" routerLink="/admin/reservas">Ver grade de reservas</a>
        </section>
        <section class="card">
          <h2>Reservas recentes</h2>
          <div class="table-scroll">
            <table>
              <caption class="sr-only">
                Reservas recentes
              </caption>
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Quadra</th>
                  <th>Horário</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (r of s.reservasRecentes; track r.id) {
                  <tr>
                    <td>{{ code(r.id) }}</td>
                    <td>{{ r.cliente?.nome }}</td>
                    <td>{{ r.quadra?.nome }}</td>
                    <td>{{ shortDate(r.data) }} · {{ r.horaInicio }}</td>
                    <td>{{ money(r.valor) }}</td>
                    <td>{{ labels[effective(r, now)] }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6">Nenhuma reserva registrada.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    }`,
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
