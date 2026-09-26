import type { ResumoDashboard } from '@/application/dto';
import { formatDataCurta } from '@/shared/lib/date';
import { formatBRL } from '@/shared/lib/format';
import { pluralizar } from '@/presentation/features/admin/shared/format';

export interface IndicadorDashboard {
  chave: 'clientes' | 'quadras' | 'reservas' | 'pagamentos';
  rotulo: string;
  valor: string;
  dica: string;
}

/** Os 4 cartões do topo do dashboard (dashStats do protótipo). */
export function montarIndicadores(resumo: ResumoDashboard): IndicadorDashboard[] {
  return [
    {
      chave: 'clientes',
      rotulo: 'Clientes',
      valor: String(resumo.clientesAtivos),
      dica: 'ativos no cadastro',
    },
    {
      chave: 'quadras',
      rotulo: 'Quadras',
      valor: String(resumo.totalQuadras),
      dica: pluralizar(resumo.quadrasAtivas, 'ativa', 'ativas'),
    },
    {
      chave: 'reservas',
      rotulo: `Reservas em ${formatDataCurta(resumo.data)}`,
      valor: String(resumo.reservasNoDia),
      dica: 'confirmadas e pendentes',
    },
    {
      chave: 'pagamentos',
      rotulo: 'Pagamentos',
      valor: formatBRL(resumo.valorRecebidoNoDia),
      dica: 'recebidos no dia',
    },
  ];
}
