import { PageHeader } from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';

export default function DashboardPage() {
  return <PageHeader title="Visão geral da arena" route={ROUTES.admin.dashboard} />;
}
