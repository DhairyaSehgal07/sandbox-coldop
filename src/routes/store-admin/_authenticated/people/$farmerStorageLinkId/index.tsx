import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/store-admin/_authenticated/people/$farmerStorageLinkId/'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>Hello "/store-admin/_authenticated/people/$farmerStorageLinkId/"!</div>
  );
}
