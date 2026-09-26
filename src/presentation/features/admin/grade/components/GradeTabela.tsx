import clsx from 'clsx';
import type { CSSProperties } from 'react';
import type { Quadra } from '@/domain/entities';
import { formatDataLonga } from '@/shared/lib/date';
import type { CelulaGrade, LinhaGrade } from '../grade.utils';
import styles from './GradeTabela.module.css';

const LARGURA_MINIMA = 760;
const LARGURA_HORARIO = 72;
const LARGURA_MINIMA_QUADRA = 96;
const ESPACAMENTO = 6;

export interface GradeTabelaProps {
  data: string;
  quadras: readonly Quadra[];
  linhas: readonly LinhaGrade[];
  /** Reservas da data ainda carregando: células desabilitadas. */
  carregando?: boolean;
  onSelecionar: (celula: CelulaGrade) => void;
}

/** Grade horário × quadra (tabela acessível com rolagem horizontal em telas estreitas). */
export function GradeTabela({ data, quadras, linhas, carregando = false, onSelecionar }: GradeTabelaProps) {
  const estilo = {
    minWidth: Math.max(LARGURA_MINIMA, LARGURA_HORARIO + quadras.length * (LARGURA_MINIMA_QUADRA + ESPACAMENTO)),
    '--grade-quadras': String(Math.max(quadras.length, 1)),
  } as CSSProperties;

  return (
    <div
      role="table"
      aria-label={`Grade de reservas de ${formatDataLonga(data)}`}
      aria-busy={carregando || undefined}
      className={clsx(styles.grade, carregando && styles.carregando)}
      style={estilo}
    >
      <div role="row" className={styles.linha}>
        <span role="columnheader">
          <span className="sr-only">Horário</span>
        </span>
        {quadras.map((quadra) => (
          <span key={quadra.id} role="columnheader" className={styles.quadra}>
            {quadra.nome}
          </span>
        ))}
      </div>

      {linhas.map((linha) => (
        <div key={linha.hora} role="row" className={styles.linha}>
          <span role="rowheader" className={styles.hora}>
            {linha.hora}
          </span>
          {linha.celulas.map((celula) => (
            <span key={celula.quadra.id} role="cell" className={styles.celulaWrap}>
              <button
                type="button"
                className={clsx(
                  styles.celula,
                  styles[celula.tipo],
                  celula.tipo === 'reservada' && celula.pago && styles.pago,
                )}
                aria-label={celula.descricao}
                title={celula.descricao}
                disabled={carregando}
                onClick={() => onSelecionar(celula)}
              >
                {celula.rotulo}
              </button>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
