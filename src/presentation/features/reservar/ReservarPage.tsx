import { PageHeader } from '@/presentation/components/ui';
import { ROUTES } from '@/presentation/routes/paths';

export default function ReservarPage() {
  return <PageHeader title="Reservar quadra" route={ROUTES.reservar} />;
}
