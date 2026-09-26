import { useId } from 'react';
import { METODO_PAGAMENTO_LABEL, METODO_PAGAMENTO_VALUES, type MetodoPagamento } from '@/domain/enums';
import { Pill } from '@/presentation/components/ui';
import { ajudaMetodoPagamento } from './ajudaMetodoPagamento';
import styles from './MetodoPagamentoPicker.module.css';

export interface MetodoPagamentoPickerProps {
  value: MetodoPagamento;
  onChange: (metodo: MetodoPagamento) => void;
  disabled?: boolean;
}

/** "Método de pagamento": pílulas Pix / Cartão / Dinheiro + explicação do pagamento simulado. */
export function MetodoPagamentoPicker({ value, onChange, disabled = false }: MetodoPagamentoPickerProps) {
  const rotuloId = useId();
  return (
    <div className={styles.metodo}>
      <div id={rotuloId} className={styles.rotulo}>
        Método de pagamento
      </div>
      <div className={styles.opcoes} role="group" aria-labelledby={rotuloId}>
        {METODO_PAGAMENTO_VALUES.map((metodo) => (
          <Pill
            key={metodo}
            size="md"
            active={metodo === value}
            disabled={disabled}
            onClick={() => onChange(metodo)}
          >
            {METODO_PAGAMENTO_LABEL[metodo]}
          </Pill>
        ))}
      </div>
      <p className={styles.ajuda} aria-live="polite">
        {ajudaMetodoPagamento(value)}
      </p>
    </div>
  );
}
