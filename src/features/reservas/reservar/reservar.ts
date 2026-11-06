import { Component, DestroyRef, Input, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getErrorMessage } from '@/shared/ui/errors';
import { Router } from '@angular/router';
import type { ReservaDetalhada } from '@/core/application/dto';
import type { Disponibilidade, Quadra } from '@/core/domain/entities';
import { METODO_PAGAMENTO_LABEL, MetodoPagamento, STATUS_QUADRA_LABEL } from '@/core/domain/enums';
import { gerarSlots, janelaDeReserva, MOTIVO_INDISPONIBILIDADE_LABEL } from '@/core/domain/rules';
import { slotsDaAlteracao, houveAlteracao } from '@/features/reservas/grade/reserva.utils';
import {
  avisoQuadraIndisponivel,
  linhasResumo,
  totalDaReserva,
  mensagemReservaCriada,
} from './reservar.utils';
import { ajudaMetodoPagamento } from '@/features/pagamentos/ajudaMetodoPagamento';
import { addDays, diaDaSemanaCurto, formatDataCurta, toISODate } from '@/shared/lib/date';
import { formatDuracao } from '@/shared/lib/format';
import { AsyncPage } from '@/shared/ui/async-page';
import { DialogComponent } from '@/shared/ui/dialog';
@Component({
  selector: 'arena-reservar',
  standalone: true,
  imports: [FormsModule, DialogComponent],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class ReservarComponent extends AsyncPage implements OnInit {
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
