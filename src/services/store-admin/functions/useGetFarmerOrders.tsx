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

/** Optional date range filter – YYYY-MM-DD strings for API */
export interface FarmerOrdersDateRange {
  from?: string;
  to?: string;
}

/** Query key factory – use for invalidation and consistent keys */
export const farmerOrdersKeys = {
  all: ['store-admin', 'farmer-orders'] as const,
  lists: () => [...farmerOrdersKeys.all, 'list'] as const,
  list: (farmerStorageLinkId: string, dateRange?: FarmerOrdersDateRange) =>
    [
      ...farmerOrdersKeys.lists(),
      farmerStorageLinkId,
      dateRange?.from ?? '',
      dateRange?.to ?? '',
    ] as const,
};

/** Fetcher used by queryOptions and prefetch */
async function fetchFarmerVouchers(
  farmerStorageLinkId: string,
  dateRange?: FarmerOrdersDateRange
): Promise<FarmerVouchersData> {
  const params: Record<string, string> = {};
  if (dateRange?.from) params.from = dateRange.from;
  if (dateRange?.to) params.to = dateRange.to;

  const { data } = await storeAdminAxiosClient.get<FarmerVouchersApiResponse>(
    `/store-admin/farmer-storage-links/${farmerStorageLinkId}/vouchers`,
    { params }
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
export function farmerOrdersQueryOptions(
  farmerStorageLinkId: string,
  dateRange?: FarmerOrdersDateRange
) {
  return queryOptions({
    queryKey: farmerOrdersKeys.list(farmerStorageLinkId, dateRange),
    queryFn: () => fetchFarmerVouchers(farmerStorageLinkId, dateRange),
    enabled: Boolean(farmerStorageLinkId),
  });
}

/** Hook to fetch incoming and outgoing vouchers for a farmer–storage link */
export function useGetFarmerOrders(
  farmerStorageLinkId: string | undefined,
  dateRange?: FarmerOrdersDateRange
) {
  return useQuery({
    ...farmerOrdersQueryOptions(farmerStorageLinkId ?? '', dateRange),
    enabled: Boolean(farmerStorageLinkId),
  });
}

/** Prefetch farmer vouchers – e.g. before navigating to people/:farmerStorageLinkId */
export function prefetchFarmerOrders(
  farmerStorageLinkId: string,
  dateRange?: FarmerOrdersDateRange
) {
  return queryClient.prefetchQuery(
    farmerOrdersQueryOptions(farmerStorageLinkId, dateRange)
  );
}
