import { AsyncContent, PageHeader, StatCard } from '@/presentation/components/ui';
import { useHoje } from '@/presentation/hooks/useHoje';
import { useResumoDashboard } from '@/presentation/queries';
import { OcupacaoCard } from './components/OcupacaoCard';
import { ReservasRecentesCard } from './components/ReservasRecentesCard';
import { montarIndicadores } from './dashboard.utils';
import styles from './DashboardPage.module.css';

/** /admin/dashboard — visão geral da arena no dia (Sprint 6). */
export default function DashboardPage() {
  const { hoje, agora } = useHoje();
  const resumo = useResumoDashboard(hoje);

  return (
    <>
      <PageHeader title="Visão geral da arena" />
      <AsyncContent query={resumo} loadingLabel="Carregando indicadores…">
        {(dados) => (
          <div className={styles.page}>
            <section className={styles.stats} aria-label="Indicadores do dia">
              {montarIndicadores(dados).map((indicador) => (
                <StatCard
                  key={indicador.chave}
                  size="lg"
                  label={indicador.rotulo}
                  value={indicador.valor}
                  hint={indicador.dica}
                />
              ))}
            </section>
            <div className={styles.columns}>
              <ReservasRecentesCard reservas={dados.reservasRecentes} agora={agora} />
              <OcupacaoCard ocupacao={dados.ocupacao} />
            </div>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
