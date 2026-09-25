import { PageHeader } from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';

export default function ClientesPage() {
  return <PageHeader title="Clientes" route={ROUTES.admin.clientes} />;
}
