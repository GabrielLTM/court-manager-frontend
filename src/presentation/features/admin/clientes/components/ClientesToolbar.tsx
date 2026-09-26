import { useId } from 'react';
import { Input } from '@/presentation/components/ui';
import { FiltroPills } from '@/presentation/features/admin/shared/FiltroPills';
import { FILTROS_STATUS_CLIENTE, type FiltroStatusCliente } from '../clientes.utils';
import styles from './ClientesToolbar.module.css';

export interface ClientesToolbarProps {
  busca: string;
  onBuscaChange: (busca: string) => void;
  status: FiltroStatusCliente;
  onStatusChange: (status: FiltroStatusCliente) => void;
}

/** Busca (nome, CPF ou e-mail) + filtro de status. */
export function ClientesToolbar({ busca, onBuscaChange, status, onStatusChange }: ClientesToolbarProps) {
  const buscaId = useId();

  return (
    <div className={styles.toolbar} role="search" aria-label="Filtrar clientes">
      <div className={styles.busca}>
        <label htmlFor={buscaId} className="sr-only">
          Buscar clientes
        </label>
        <Input
          id={buscaId}
          type="search"
          placeholder="Buscar por nome, CPF ou e-mail"
          autoComplete="off"
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
        />
      </div>
      <FiltroPills
        options={FILTROS_STATUS_CLIENTE}
        value={status}
        onChange={onStatusChange}
        ariaLabel="Filtrar por status"
      />
    </div>
  );
}
