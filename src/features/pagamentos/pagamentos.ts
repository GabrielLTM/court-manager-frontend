import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PagamentoDetalhado } from '@/core/application/dto';
import { METODO_PAGAMENTO_LABEL, STATUS_PAGAMENTO_LABEL } from '@/core/domain/enums';
import { pagamentoPodeSerConfirmado } from '@/core/domain/rules';
import {
  FILTROS_PAGAMENTO,
  filtrarPagamentos,
  resumirPagamentos,
  type FiltroPagamento,
} from './pagamentos.utils';
import { formatDataHora, formatDataLonga } from '@/shared/lib/date';
import { formatBRL, formatCodigoReserva } from '@/shared/lib/format';
import { AsyncPage } from '@/shared/ui/async-page';
import { DialogComponent } from '@/shared/ui/dialog';
import { PaginationComponent } from '@/shared/ui/pagination';
@Component({
  standalone: true,
  imports: [FormsModule, DialogComponent, PaginationComponent],
  templateUrl: './pagamentos.html',
})
export class PagamentosComponent extends AsyncPage {
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
