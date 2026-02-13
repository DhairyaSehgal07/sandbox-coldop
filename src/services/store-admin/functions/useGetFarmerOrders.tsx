import { useQuery, queryOptions } from '@tanstack/react-query';
import storeAdminAxiosClient from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';

/** API response shape for GET /store-admin/farmer-storage-links/:id/vouchers */
export interface FarmerVouchersApiResponse {
  success: boolean;
  data: {
    incoming: DaybookEntry[];
    outgoing: DaybookEntry[];
  };
  message?: string;
}

/** Result shape: incoming (RECEIPT) and outgoing (DELIVERY) vouchers for a farmer link */
export interface FarmerVouchersData {
  incoming: DaybookEntry[];
  outgoing: DaybookEntry[];
}

/** Query key factory – use for invalidation and consistent keys */
export const farmerOrdersKeys = {
  all: ['store-admin', 'farmer-orders'] as const,
  lists: () => [...farmerOrdersKeys.all, 'list'] as const,
  list: (farmerStorageLinkId: string) =>
    [...farmerOrdersKeys.lists(), farmerStorageLinkId] as const,
};

/** Fetcher used by queryOptions and prefetch */
async function fetchFarmerVouchers(
  farmerStorageLinkId: string
): Promise<FarmerVouchersData> {
  const { data } = await storeAdminAxiosClient.get<FarmerVouchersApiResponse>(
    `/store-admin/farmer-storage-links/${farmerStorageLinkId}/vouchers`
  );

  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Failed to fetch farmer vouchers');
  }

  return {
    incoming: data.data.incoming ?? [],
    outgoing: data.data.outgoing ?? [],
  };
}

/** Query options – use with useQuery, prefetchQuery, or in loaders */
export function farmerOrdersQueryOptions(farmerStorageLinkId: string) {
  return queryOptions({
    queryKey: farmerOrdersKeys.list(farmerStorageLinkId),
    queryFn: () => fetchFarmerVouchers(farmerStorageLinkId),
    enabled: Boolean(farmerStorageLinkId),
  });
}

/** Hook to fetch incoming and outgoing vouchers for a farmer–storage link */
export function useGetFarmerOrders(farmerStorageLinkId: string | undefined) {
  return useQuery({
    ...farmerOrdersQueryOptions(farmerStorageLinkId ?? ''),
    enabled: Boolean(farmerStorageLinkId),
  });
}

/** Prefetch farmer vouchers – e.g. before navigating to people/:farmerStorageLinkId */
export function prefetchFarmerOrders(farmerStorageLinkId: string) {
  return queryClient.prefetchQuery(
    farmerOrdersQueryOptions(farmerStorageLinkId)
  );
}
