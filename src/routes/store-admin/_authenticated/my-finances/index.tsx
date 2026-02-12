import { createFileRoute } from '@tanstack/react-router';
import MyFinancesPage from '@/components/my-finances';

export const Route = createFileRoute(
  '/store-admin/_authenticated/my-finances/'
)({
  component: MyFinancesPage,
});
