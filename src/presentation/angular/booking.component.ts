import { Component, DestroyRef, Input, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getErrorMessage } from '@/presentation/lib/errors';
import { Router } from '@angular/router';
import type { ReservaDetalhada } from '@/application/dto';
import type { Disponibilidade, Quadra } from '@/domain/entities';
import { METODO_PAGAMENTO_LABEL, MetodoPagamento, STATUS_QUADRA_LABEL } from '@/domain/enums';
import { gerarSlots, janelaDeReserva, MOTIVO_INDISPONIBILIDADE_LABEL } from '@/domain/rules';
import {
  slotsDaAlteracao,
  houveAlteracao,
} from '@/presentation/features/admin/grade/reserva.utils';
import {
  avisoQuadraIndisponivel,
  linhasResumo,
  totalDaReserva,
  mensagemReservaCriada,
} from '@/presentation/features/reservar/reservar.utils';
import { ajudaMetodoPagamento } from '@/presentation/components/MetodoPagamentoPicker/ajudaMetodoPagamento';
import { addDays, diaDaSemanaCurto, formatDataCurta, toISODate } from '@/shared/lib/date';
import { formatDuracao } from '@/shared/lib/format';
import { AsyncPage, DialogComponent } from './shared';
@Component({
  selector: 'arena-booking',
  standalone: true,
  imports: [FormsModule, DialogComponent],
  template: `
    @if (!reservation) {
      <h1>Reservar quadra</h1>
    }
    @if (loading()) {
      <p role="status">Carregando quadras…</p>
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
      <button class="btn" (click)="load()">Tentar novamente</button>
    }
    <div class="booking-layout">
      <div class="steps">
        <section class="card">
          <h2>1. Data</h2>
          <div class="date-strip">
            @for (day of days; track day) {
              <button
                class="btn"
                [class.selected]="date === day"
                [attr.aria-pressed]="date === day"
                (click)="date = day; refresh()"
              >
                {{ weekday(day) }}<br />{{ shortDate(day) }}
              </button>
            }
          </div>
          <label for="booking-date">Escolher outra data</label
          ><input
            id="booking-date"
            type="date"
            [(ngModel)]="date"
            [min]="today"
            [max]="lastDay"
            (ngModelChange)="refresh()"
          /><small>Reservas até 30 dias à frente</small>
        </section>
        <section class="card">
          <h2>2. Quadra</h2>
          <div class="options">
            @for (q of courts(); track q.id) {
              <button
                class="btn court-option"
                [class.selected]="courtId === q.id"
                [attr.aria-pressed]="courtId === q.id"
                [attr.aria-disabled]="q.status !== 1"
                (click)="chooseCourt(q)"
              >
                <strong>{{ q.nome }}</strong
                ><span>{{ q.tipo }}</span
                ><small>{{ courtLabels[q.status] }}</small>
              </button>
            } @empty {
              <p>Nenhuma quadra cadastrada.</p>
            }
          </div>
        </section>
        <section class="card">
          <h2>3. Duração</h2>
          <div class="actions">
            @for (d of durations; track d) {
              <button
                class="btn"
                [class.selected]="duration === d"
                [attr.aria-pressed]="duration === d"
                (click)="duration = d; hour = null"
              >
                {{ formatDuration(d) }}
              </button>
            }
          </div>
        </section>
        <section class="card">
          <h2>4. Horários disponíveis</h2>
          @if (availabilityLoading()) {
            <p role="status">Consultando disponibilidade…</p>
          } @else if (availabilityError()) {
            <p role="alert">{{ availabilityError() }}</p>
            <button class="btn" (click)="refresh()">Tentar novamente</button>
          } @else {
            <div class="slots">
              @for (slot of slots; track slot.hora) {
                <button
                  class="btn"
                  [class.selected]="hour === slot.hora && slot.disponivel"
                  [attr.aria-pressed]="hour === slot.hora && slot.disponivel"
                  [attr.aria-disabled]="!slot.disponivel"
                  [title]="
                    slot.disponivel ? slot.hora + '–' + slot.fim : reasons[slot.motivo || 'ocupado']
                  "
                  (click)="chooseHour(slot.hora, slot.disponivel, slot.motivo)"
                >
                  {{ slot.hora }}
                </button>
              } @empty {
                <p>Selecione uma quadra e uma data para consultar os horários.</p>
              }
            </div>
            <small>Horários indisponíveis aparecem desativados.</small>
          }
        </section>
      </div>
      <aside class="card summary">
        @if (submissionError()) {
          <p role="alert" class="field-error">{{ submissionError() }}</p>
        }
        <p class="kicker">{{ court?.nome || 'Sua partida' }}</p>
        <h2>Resumo da reserva</h2>
        <dl>
          @for (line of summary; track line.label) {
            <dt>{{ line.label }}</dt>
            <dd>{{ line.value }}</dd>
          }
        </dl>
        <p class="price">{{ total }}</p>
        <button
          class="btn btn-primary"
          [disabled]="!valid || busy() || availabilityLoading() || !changed"
          (click)="confirming.set(true)"
        >
          {{ reservation ? 'Salvar alteração' : 'Confirmar reserva' }}
        </button>
      </aside>
    </div>
    @if (confirming()) {
      <arena-dialog
        [title]="reservation ? 'Alterar reserva' : 'Confirmar reserva'"
        [busy]="busy()"
        (closed)="confirming.set(false)"
        ><p>
          {{ court?.nome }} · {{ shortDate(date) }} · {{ hour }} · {{ formatDuration(duration) }}
        </p>
        <p class="price">{{ total }}</p>
        @if (!reservation) {
          <label for="booking-method">Método de pagamento</label
          ><select id="booking-method" [(ngModel)]="method" [disabled]="busy()">
            @for (m of methods; track m) {
              <option [ngValue]="m">{{ methodLabels[m] }}</option>
            }
          </select>
          <p>{{ help(method) }}</p>
        } @else {
          <p>A alteração será validada novamente para evitar conflitos de horário.</p>
        }
        <div class="actions">
          <button autofocus class="btn" [disabled]="busy()" (click)="confirming.set(false)">
            Voltar</button
          ><button
            class="btn btn-primary"
            [disabled]="busy()"
            [attr.aria-busy]="busy()"
            (click)="confirm()"
          >
            {{ busy() ? 'Salvando…' : reservation ? 'Salvar alteração' : 'Confirmar e pagar' }}
          </button>
        </div></arena-dialog
      >
    }
  `,
})
export class BookingComponent extends AsyncPage implements OnInit {
  @Input() reservation: ReservaDetalhada | null = null;
  saved = output<void>();
  private router = inject(Router);
  courts = signal<Quadra[]>([]);
  availability = signal<Disponibilidade | null>(null);
  availabilityLoading = signal(false);
  availabilityError = signal('');
  confirming = signal(false);
  submissionError = signal('');
  now = signal(this.services.clock.now());
  date = toISODate(this.now());
  courtId: number | null = null;
  duration = 60;
  hour: string | null = null;
  method: MetodoPagamento = MetodoPagamento.Pix;
  private availabilityVersion = 0;
  readonly durations = [60, 90, 120];
  readonly methods = [MetodoPagamento.Pix, MetodoPagamento.Cartao, MetodoPagamento.Dinheiro];
  readonly methodLabels = METODO_PAGAMENTO_LABEL;
  readonly courtLabels = STATUS_QUADRA_LABEL;
  readonly reasons = MOTIVO_INDISPONIBILIDADE_LABEL;
  readonly formatDuration = formatDuracao;
  readonly shortDate = formatDataCurta;
  readonly weekday = diaDaSemanaCurto;
  readonly help = ajudaMetodoPagamento;
  constructor() {
    super();
    const tick = setInterval(() => this.now.set(this.services.clock.now()), 30000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }
  ngOnInit() {
    if (this.reservation) {
      this.date = this.reservation.data;
      this.courtId = this.reservation.quadraId;
      this.duration = this.reservation.duracaoMinutos;
      this.hour = this.reservation.horaInicio;
    }
    this.load();
  }
  get today() {
    return toISODate(this.now());
  }
  get lastDay() {
    return janelaDeReserva(this.today).fim;
  }
  get days() {
    return Array.from({ length: 7 }, (_, i) => addDays(this.today, i));
  }
  get court() {
    return this.courts().find((q) => q.id === this.courtId) ?? null;
  }
  get slots() {
    if (!this.availability()) return [];
    const args = {
      quadra: this.court,
      data: this.date,
      duracaoMinutos: this.duration,
      agora: this.now(),
    };
    return this.reservation
      ? slotsDaAlteracao({
          ...args,
          reserva: this.reservation,
          disponibilidade: this.availability()!,
        })
      : gerarSlots({ ...args, ocupados: this.availability()!.ocupados });
  }
  get valid() {
    return !!this.hour && this.slots.some((s) => s.hora === this.hour && s.disponivel);
  }
  get changed() {
    return (
      !this.reservation ||
      houveAlteracao(this.reservation, {
        quadraId: this.courtId,
        data: this.date,
        duracaoMinutos: this.duration,
        horaInicio: this.hour,
      })
    );
  }
  get summary() {
    return linhasResumo({
      quadra: this.court,
      data: this.date,
      horaInicio: this.valid ? this.hour : null,
      duracaoMinutos: this.duration,
    });
  }
  get total() {
    return totalDaReserva(this.court, this.duration);
  }
  load() {
    void this.request(
      () => this.services.quadras.listar(),
      (courts) => {
        this.courts.set(courts);
        this.courtId ??= courts.find((q) => q.status === 1)?.id ?? null;
        void this.refresh(false);
      },
    );
  }
  chooseCourt(q: Quadra) {
    if (q.status !== 1) {
      this.state.notify(avisoQuadraIndisponivel(q));
      return;
    }
    this.courtId = q.id;
    void this.refresh();
  }
  chooseHour(
    hour: string,
    available: boolean,
    reason?: keyof typeof MOTIVO_INDISPONIBILIDADE_LABEL,
  ) {
    if (available) this.hour = hour;
    else this.state.notify(this.reasons[reason ?? 'ocupado']);
  }
  async refresh(reset = true) {
    if (reset) this.hour = null;
    const version = ++this.availabilityVersion;
    this.availability.set(null);
    this.availabilityError.set('');
    if (!this.courtId || !this.date) return;
    this.availabilityLoading.set(true);
    try {
      const result = await this.services.quadras.consultarDisponibilidade(this.courtId, this.date);
      if (!this.destroyed && version === this.availabilityVersion) this.availability.set(result);
    } catch (e) {
      if (version === this.availabilityVersion)
        this.availabilityError.set(
          e instanceof Error ? e.message : 'Não foi possível consultar a disponibilidade.',
        );
    } finally {
      if (version === this.availabilityVersion) this.availabilityLoading.set(false);
    }
  }
  async confirm() {
    this.submissionError.set('');
    if (!this.valid || !this.courtId || !this.hour || this.busy()) return;
    this.busy.set(true);
    try {
      const input = {
        quadraId: this.courtId,
        data: this.date,
        horaInicio: this.hour,
        duracaoMinutos: this.duration,
      };
      if (this.reservation) {
        await this.services.reservas.alterar(this.reservation.id, input);
        this.state.notify('Reserva alterada');
        this.saved.emit();
      } else {
        const clienteId = this.state.session()?.usuario.clienteId;
        if (!clienteId) throw new Error('Somente clientes podem realizar reservas.');
        const result = await this.services.reservas.criar({
          ...input,
          clienteId,
          metodoPagamento: this.method,
        });
        this.state.notify(mensagemReservaCriada(result.reserva));
        await this.router.navigateByUrl('/minhas-reservas');
      }
      this.confirming.set(false);
    } catch (e) {
      this.submissionError.set(getErrorMessage(e));
      this.state.error(e);
      this.confirming.set(false);
      void this.refresh();
    } finally {
      this.busy.set(false);
    }
  }
}
