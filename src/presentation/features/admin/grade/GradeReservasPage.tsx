import { PageHeader } from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';

export default function GradeReservasPage() {
  return <PageHeader title="Grade de reservas" route={ROUTES.admin.reservas} />;
}
