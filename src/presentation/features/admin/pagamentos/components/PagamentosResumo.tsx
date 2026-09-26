import { StatCard } from '@/presentation/components/ui';
import { formatBRL } from '@/shared/lib/format';
import { descreverQuantidade, type ResumoPagamentos } from '../pagamentos.utils';
import styles from './PagamentosResumo.module.css';

/** Cartões Recebido / A receber / Estornado. */
export function PagamentosResumo({ resumo }: { resumo: ResumoPagamentos }) {
  const cartoes = [
    { chave: 'recebido', rotulo: 'Recebido', ...resumo.recebido },
    { chave: 'aReceber', rotulo: 'A receber', ...resumo.aReceber },
    { chave: 'estornado', rotulo: 'Estornado', ...resumo.estornado },
  ];

  return (
    <section className={styles.resumo} aria-label="Resumo dos pagamentos">
      {cartoes.map((cartao) => (
        <StatCard
          key={cartao.chave}
          label={cartao.rotulo}
          value={formatBRL(cartao.total)}
          hint={descreverQuantidade(cartao.quantidade)}
        />
      ))}
    </section>
  );
}
