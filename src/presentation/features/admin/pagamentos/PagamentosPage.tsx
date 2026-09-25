import { PageHeader } from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';

export default function PagamentosPage() {
  return <PageHeader title="Pagamentos" route={ROUTES.admin.pagamentos} />;
}
