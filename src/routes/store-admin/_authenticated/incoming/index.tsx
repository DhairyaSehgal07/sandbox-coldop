import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/store-admin/_authenticated/incoming/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/store-admin/_authenticated/incoming/"!</div>;
}
