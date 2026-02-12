import { createFileRoute, useLocation } from '@tanstack/react-router';
import IncomingForm from '@/components/forms/incoming';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';

export const Route = createFileRoute(
  '/store-admin/_authenticated/incoming/edit/$id/'
)({
  component: IncomingEditPage,
});

function IncomingEditPage() {
  const { id } = Route.useParams();
  const location = useLocation();
  const entry = location.state?.entry as DaybookEntry | undefined;

  if (!entry) {
    return (
      <main className="font-custom mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-12">
        <p className="text-muted-foreground font-custom text-sm">
          No incoming order data. Please open edit from the daybook.
        </p>
      </main>
    );
  }

  return <IncomingForm editEntry={entry} editId={id} />;
}
