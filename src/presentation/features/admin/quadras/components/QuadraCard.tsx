import { useId } from 'react';
import type { Quadra } from '@/domain/entities';
import type { StatusQuadra } from '@/domain/enums';
import { Button, Card, Pill, StatusTag } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAlterarStatusQuadra } from '@/presentation/queries';
import { formatBRL } from '@/shared/lib/format';
import { ACOES_STATUS_QUADRA, mensagemStatusQuadra } from '../quadras.utils';
import styles from './QuadraCard.module.css';

export interface QuadraCardProps {
  quadra: Quadra;
  onEditar: (quadra: Quadra) => void;
}

/** Cartão da quadra: status, tipo, valor/hora, ações de status (RF07) e edição (RF06). */
export function QuadraCard({ quadra, onEditar }: QuadraCardProps) {
  const toast = useToast();
  const alterarStatus = useAlterarStatusQuadra();
  const tituloId = useId();

  // Enquanto a alteração está em andamento, a pílula escolhida já aparece selecionada.
  const statusSelecionado = alterarStatus.isPending ? alterarStatus.variables.status : quadra.status;

  const aplicarStatus = async (status: StatusQuadra) => {
    if (alterarStatus.isPending || status === quadra.status) return;
    try {
      await alterarStatus.mutateAsync({ id: quadra.id, status });
      toast.success(mensagemStatusQuadra(quadra.nome, status));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card as="article" elevation="sm" padding="md" gap="md" aria-labelledby={tituloId}>
      <div className={styles.header}>
        <h2 id={tituloId} className={styles.nome}>
          {quadra.nome}
        </h2>
        <StatusTag kind="quadra" status={quadra.status} />
      </div>
      <div className={styles.tipo}>{quadra.tipo}</div>
      <div className={styles.preco}>
        {formatBRL(quadra.valorHora)}
        <span className={styles.unidade}>/hora</span>
      </div>
      <div className={styles.acoes}>
        <div
          className={styles.status}
          role="group"
          aria-label={`Status da ${quadra.nome}`}
          aria-busy={alterarStatus.isPending || undefined}
        >
          {ACOES_STATUS_QUADRA.map((acao) => (
            <Pill
              key={acao.status}
              size="sm"
              tone="plain"
              active={statusSelecionado === acao.status}
              onClick={() => void aplicarStatus(acao.status)}
            >
              {acao.rotulo}
            </Pill>
          ))}
        </div>
        <Button
          variant="ghost"
          className={styles.editar}
          onClick={() => onEditar(quadra)}
          aria-label={`Editar ${quadra.nome}`}
        >
          Editar
        </Button>
      </div>
    </Card>
  );
}
