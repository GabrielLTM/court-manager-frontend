import type { ResumoDashboard } from '@/application/dto';
import { montarIndicadores } from '../dashboard.utils';

const resumo: ResumoDashboard = {
  data: '2026-09-20',
  clientesAtivos: 11,
  totalQuadras: 6,
  quadrasAtivas: 4,
  reservasNoDia: 6,
  valorRecebidoNoDia: 562.5,
  reservasRecentes: [],
  ocupacao: [],
};

describe('montarIndicadores', () => {
  it('monta os quatro cartões do dashboard com os textos do protótipo', () => {
    expect(montarIndicadores(resumo)).toEqual([
      { chave: 'clientes', rotulo: 'Clientes', valor: '11', dica: 'ativos no cadastro' },
      { chave: 'quadras', rotulo: 'Quadras', valor: '6', dica: '4 ativas' },
      { chave: 'reservas', rotulo: 'Reservas em 20/09', valor: '6', dica: 'confirmadas e pendentes' },
      { chave: 'pagamentos', rotulo: 'Pagamentos', valor: 'R$ 562,50', dica: 'recebidos no dia' },
    ]);
  });

  it('usa o singular quando há uma única quadra ativa', () => {
    const [, quadras] = montarIndicadores({ ...resumo, totalQuadras: 1, quadrasAtivas: 1 });
    expect(quadras.dica).toBe('1 ativa');
  });
});
