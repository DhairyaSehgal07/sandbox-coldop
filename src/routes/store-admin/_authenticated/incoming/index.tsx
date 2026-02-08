import { createFileRoute } from '@tanstack/react-router';
import IncomingForm from '@/components/forms/incoming';

export const Route = createFileRoute('/store-admin/_authenticated/incoming/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <IncomingForm />;
}
