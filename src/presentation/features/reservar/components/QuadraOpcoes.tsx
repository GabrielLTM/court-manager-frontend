import clsx from 'clsx';
import type { Quadra } from '@/domain/entities';
import { quadraPodeSerReservada } from '@/domain/rules';
import { StatusTag } from '@/presentation/components/ui';
import { formatBRL } from '@/shared/lib/format';
import styles from './QuadraOpcoes.module.css';

export interface QuadraOpcoesProps {
  quadras: readonly Quadra[];
  selecionadaId: number | null;
  onSelecionar: (quadra: Quadra) => void;
  /** RN03 — clique em quadra inativa/em manutenção (ex.: exibir o motivo). */
  onIndisponivel: (quadra: Quadra) => void;
}

/** Passo "2. Quadra": cartões com nome, status, tipo e valor por hora. */
export function QuadraOpcoes({ quadras, selecionadaId, onSelecionar, onIndisponivel }: QuadraOpcoesProps) {
  if (quadras.length === 0) return <p className={styles.vazio}>Nenhuma quadra cadastrada.</p>;

  return (
    <div className={styles.grid} role="group" aria-label="Quadras">
      {quadras.map((quadra) => {
        const reservavel = quadraPodeSerReservada(quadra);
        const selecionada = quadra.id === selecionadaId;
        return (
          <button
            key={quadra.id}
            type="button"
            className={clsx(styles.opcao, selecionada && styles.selecionada, !reservavel && styles.indisponivel)}
            aria-pressed={selecionada}
            aria-disabled={!reservavel || undefined}
            onClick={() => (reservavel ? onSelecionar(quadra) : onIndisponivel(quadra))}
          >
            {/* Os espaços entre os blocos só compõem o nome acessível do botão. */}
            <span className={styles.topo}>
              <span className={styles.nome}>{quadra.nome}</span>{' '}
              <StatusTag kind="quadra" status={quadra.status} className={styles.status} />
            </span>{' '}
            <span className={styles.detalhe}>
              {quadra.tipo} · {formatBRL(quadra.valorHora)}/h
            </span>
          </button>
        );
      })}
    </div>
  );
}
