import clsx from 'clsx';
import { useState } from 'react';
import { Link } from 'react-router';
import type { ReservaDetalhada } from '@/application/dto';
import { REGRAS_RESERVA } from '@/domain/rules';
import { Card, EmptyState } from '@/presentation/components/ui';
import { useHoje } from '@/presentation/hooks/useHoje';
import { ROUTES } from '@/presentation/routes/paths';
import { calcularEstatisticas, ordenarReservas } from '../minhasReservas.utils';
import { CancelarReservaDialog } from './CancelarReservaDialog';
import { CartoesEstatisticas } from './CartoesEstatisticas';
import { PagarReservaDialog } from './PagarReservaDialog';
import { ReservasTabela } from './ReservasTabela';
import styles from './MinhasReservasConteudo.module.css';

/** Indicadores + tabela de reservas do cliente, com os diálogos de pagamento e cancelamento. */
export function MinhasReservasConteudo({ reservas }: { reservas: readonly ReservaDetalhada[] }) {
  const { agora } = useHoje();
  const [cancelando, setCancelando] = useState<ReservaDetalhada | null>(null);
  const [pagando, setPagando] = useState<ReservaDetalhada | null>(null);

  const ordenadas = ordenarReservas(reservas, agora);

  return (
    <div className={styles.conteudo}>
      <CartoesEstatisticas estatisticas={calcularEstatisticas(reservas, agora)} />

      <Card padding="md" gap="md" scrollX>
        {ordenadas.length > 0 ? (
          <ReservasTabela reservas={ordenadas} agora={agora} onCancelar={setCancelando} onPagar={setPagando} />
        ) : (
          <EmptyState
            title="Você ainda não tem reservas"
            description="Escolha a data, a quadra e o horário para garantir o seu jogo."
            action={
              <Link to={ROUTES.reservar} className={clsx('btn btn-primary', styles.linkBotao)}>
                Reservar quadra
              </Link>
            }
          />
        )}
      </Card>

      <p className={styles.nota}>
        RN08 — o cancelamento é permitido até {REGRAS_RESERVA.antecedenciaCancelamentoHoras} horas antes do horário
        da reserva.
      </p>

      {cancelando && (
        <CancelarReservaDialog key={cancelando.id} reserva={cancelando} onClose={() => setCancelando(null)} />
      )}
      {pagando && <PagarReservaDialog key={pagando.id} reserva={pagando} onClose={() => setPagando(null)} />}
    </div>
  );
}
