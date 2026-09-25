import { describeStatus, type StatusDescriptor } from './status';
import { Tag } from './Tag';

/** Tag colorida para status de reserva, pagamento, quadra ou cliente. Pagamento nulo = "Pendente". */
export function StatusTag(props: StatusDescriptor & { className?: string }) {
  const { label, tone } = describeStatus(props);
  return (
    <Tag tone={tone} className={props.className}>
      {label}
    </Tag>
  );
}
