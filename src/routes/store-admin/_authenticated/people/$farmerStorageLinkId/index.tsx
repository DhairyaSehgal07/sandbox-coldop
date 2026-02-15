import { createFileRoute } from '@tanstack/react-router';
import FarmerProfilePage from '@/components/people/farmer-profile';

export const Route = createFileRoute(
  '/store-admin/_authenticated/people/$farmerStorageLinkId/'
)({
  component: function FarmerProfileRoute() {
    const { farmerStorageLinkId } = Route.useParams();
    return <FarmerProfilePage farmerStorageLinkId={farmerStorageLinkId} />;
  },
});
