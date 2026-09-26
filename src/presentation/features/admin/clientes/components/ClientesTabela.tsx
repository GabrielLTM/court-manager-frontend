import type { Cliente } from '@/domain/entities';
import { StatusCliente } from '@/domain/enums';
import { Button, DataTable, StatusTag, type Column } from '@/presentation/components/ui';
import { getErrorMessage } from '@/presentation/lib/errors';
import { useToast } from '@/presentation/providers/ToastContext';
import { useAlterarStatusCliente } from '@/presentation/queries';
import { maskCpf, maskTelefone } from '@/shared/lib/masks';
import { mensagemStatusCliente } from '../clientes.utils';
import styles from './ClientesTabela.module.css';

export interface ClientesTabelaProps {
  clientes: readonly Cliente[];
  /** Reservas por cliente; `null` enquanto as reservas carregam. */
  reservasPorCliente: ReadonlyMap<number, number> | null;
  onEditar: (cliente: Cliente) => void;
  emptyMessage: string;
}

/** Tabela de clientes com edição (RF02) e inativação/reativação (RF04). */
export function ClientesTabela({ clientes, reservasPorCliente, onEditar, emptyMessage }: ClientesTabelaProps) {
  const toast = useToast();
  const alterarStatus = useAlterarStatusCliente();

  const alternarStatus = async (cliente: Cliente) => {
    const status = cliente.status === StatusCliente.Ativo ? StatusCliente.Inativo : StatusCliente.Ativo;
    try {
      await alterarStatus.mutateAsync({ id: cliente.id, status });
      toast.success(mensagemStatusCliente(cliente.nome, status));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const columns: Column<Cliente>[] = [
    { key: 'nome', header: 'Nome', render: (c) => c.nome, className: styles.nome },
    { key: 'cpf', header: 'CPF', render: (c) => maskCpf(c.cpf), className: styles.nowrap },
    { key: 'telefone', header: 'Telefone', render: (c) => maskTelefone(c.telefone), className: styles.nowrap },
    { key: 'email', header: 'E-mail', render: (c) => c.email },
    {
      key: 'reservas',
      header: 'Reservas',
      render: (c) => (reservasPorCliente ? (reservasPorCliente.get(c.id) ?? 0) : '—'),
    },
    { key: 'status', header: 'Status', render: (c) => <StatusTag kind="cliente" status={c.status} /> },
    {
      key: 'acoes',
      header: <span className="sr-only">Ações</span>,
      align: 'right',
      render: (c) => {
        const acao = c.status === StatusCliente.Ativo ? 'Inativar' : 'Reativar';
        const pendente = alterarStatus.isPending && alterarStatus.variables.id === c.id;
        return (
          <div className={styles.acoes}>
            <Button variant="ghost" onClick={() => onEditar(c)} aria-label={`Editar ${c.nome}`}>
              Editar
            </Button>
            <Button
              variant="ghost"
              loading={pendente}
              onClick={() => void alternarStatus(c)}
              aria-label={`${acao} ${c.nome}`}
            >
              {acao}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={clientes}
      getRowKey={(c) => c.id}
      minWidth={720}
      caption="Clientes cadastrados"
      emptyMessage={emptyMessage}
    />
  );
}
