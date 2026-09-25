import {
  STATUS_CLIENTE_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_QUADRA_LABEL,
  STATUS_RESERVA_LABEL,
  StatusCliente,
  StatusPagamento,
  StatusQuadra,
  StatusReserva,
} from '@/domain/enums';
import type { TagTone } from './Tag';

export type StatusDescriptor =
  | { kind: 'reserva'; status: StatusReserva }
  | { kind: 'pagamento'; status: StatusPagamento | null | undefined }
  | { kind: 'quadra'; status: StatusQuadra }
  | { kind: 'cliente'; status: StatusCliente };

/** statusClass() do protótipo: verde = ok, laranja = atenção, neutro = encerrado/inativo. */
export function describeStatus(descriptor: StatusDescriptor): { label: string; tone: TagTone } {
  switch (descriptor.kind) {
    case 'reserva': {
      const s = descriptor.status;
      const tone = s === StatusReserva.Confirmada ? 'accent-2' : s === StatusReserva.Pendente ? 'accent' : 'neutral';
      return { label: STATUS_RESERVA_LABEL[s], tone };
    }
    case 'pagamento': {
      const s = descriptor.status ?? StatusPagamento.Pendente;
      const tone = s === StatusPagamento.Pago ? 'accent-2' : s === StatusPagamento.Pendente ? 'accent' : 'neutral';
      return { label: STATUS_PAGAMENTO_LABEL[s], tone };
    }
    case 'quadra': {
      const s = descriptor.status;
      const tone = s === StatusQuadra.Ativa ? 'accent-2' : s === StatusQuadra.Manutencao ? 'accent' : 'neutral';
      return { label: STATUS_QUADRA_LABEL[s], tone };
    }
    case 'cliente': {
      const s = descriptor.status;
      return { label: STATUS_CLIENTE_LABEL[s], tone: s === StatusCliente.Ativo ? 'accent-2' : 'neutral' };
    }
  }
}
