import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Pill } from '@/presentation/components/ui/Pill';
import {
  DIAS_SEMANA_INICIAL,
  addDays,
  addMonths,
  daysInMonth,
  diaDaSemanaCurto,
  formatDataLonga,
  formatMesAno,
  parseISODate,
  startOfMonth,
} from '@/shared/lib/date';
import styles from './DateSelector.module.css';

export interface DateSelectorProps {
  /** Data selecionada (ISO "YYYY-MM-DD"). */
  value: string;
  onChange: (data: string) => void;
  /** Primeiro dia da faixa de atalhos (normalmente hoje). */
  inicio: string;
  /** Limites selecionáveis no calendário (inclusivos). */
  min: string;
  max: string;
  diasVisiveis?: number;
  /** Texto no rodapé do calendário (ex.: "Reservas até 30 dias à frente"). */
  nota?: ReactNode;
}

/** Faixa de 7 dias + calendário mensal em popover ("›"), como no protótipo. */
export function DateSelector({ value, onChange, inicio, min, max, diasVisiveis = 7, nota }: DateSelectorProps) {
  const [aberto, setAberto] = useState(false);
  const [mes, setMes] = useState(() => startOfMonth(value));
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dias = useMemo(
    () => Array.from({ length: diasVisiveis }, (_, i) => addDays(inicio, i)).filter((d) => d >= min && d <= max),
    [inicio, diasVisiveis, min, max],
  );
  const foraDaFaixa = !dias.includes(value);

  useEffect(() => {
    if (!aberto) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setAberto(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [aberto]);

  const selecionar = (data: string) => {
    onChange(data);
    setAberto(false);
  };

  const alternarCalendario = () => {
    if (!aberto) setMes(startOfMonth(value));
    setAberto((atual) => !atual);
  };

  const podeVoltar = mes > startOfMonth(min);
  const podeAvancar = mes < startOfMonth(max);
  const brancos = parseISODate(mes).getDay();
  const celulas = Array.from({ length: daysInMonth(mes) }, (_, i) => addDays(mes, i));

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.strip} role="group" aria-label="Datas próximas">
        {dias.map((dia) => (
          <Pill
            key={dia}
            active={dia === value}
            className={styles.chip}
            onClick={() => selecionar(dia)}
            aria-label={formatDataLonga(dia)}
          >
            <span className={styles.chipContent}>
              <span className={styles.dow}>{diaDaSemanaCurto(dia)}</span>
              <span className={styles.day}>{parseISODate(dia).getDate()}</span>
            </span>
          </Pill>
        ))}
        <Pill
          active={foraDaFaixa || aberto}
          className={styles.more}
          onClick={alternarCalendario}
          title="Mais datas"
          aria-label="Mais datas"
          aria-expanded={aberto}
          aria-haspopup="dialog"
        >
          ›
        </Pill>
      </div>

      {aberto && (
        <Card elevation="lg" padding="md" gap="md" className={styles.popover} role="dialog" aria-label="Calendário">
          <div className={styles.popHeader}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setMes(addMonths(mes, -1))}
              disabled={!podeVoltar}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <span className={styles.monthTitle}>{formatMesAno(mes)}</span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setMes(addMonths(mes, 1))}
              disabled={!podeAvancar}
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
          <div className={styles.weekdays} aria-hidden>
            {DIAS_SEMANA_INICIAL.map((letra, i) => (
              <span key={i} className={styles.weekday}>
                {letra}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {Array.from({ length: brancos }, (_, i) => (
              <span key={`b${i}`} className={styles.blank} />
            ))}
            {celulas.map((dia) => {
              const fora = dia < min || dia > max;
              return (
                <button
                  key={dia}
                  type="button"
                  className={clsx(styles.cell, dia === value && styles.selected, dia === inicio && styles.today)}
                  disabled={fora}
                  onClick={() => selecionar(dia)}
                  aria-label={formatDataLonga(dia)}
                  aria-pressed={dia === value}
                >
                  {parseISODate(dia).getDate()}
                </button>
              );
            })}
          </div>
          <div className={styles.footer}>
            <span className={styles.note}>{nota}</span>
            <Button variant="ghost" onClick={() => setAberto(false)}>
              Fechar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
