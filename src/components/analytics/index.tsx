import { memo, useMemo } from 'react';

import {
  Item,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  ItemActions,
} from '@/components/ui/item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, RefreshCw, Wheat, Ruler } from 'lucide-react';
import { useGetStorageSummary } from '@/services/analytics/useGetStorageSummary';
import { StorageSummaryTable } from '@/components/analytics/storage-summary-table';
import { useStore } from '@/stores/store';

const AnalyticsPage = memo(function AnalyticsPage() {
  const { data, isLoading, error, refetch, isFetching } =
    useGetStorageSummary();
  const preferenceSizes = useStore(
    (s) => s.preferences?.commodities?.[0]?.sizes ?? []
  );

  /** Table size columns: preference order first, then any sizes from API not in preferences. */
  const sizesForTable = useMemo(() => {
    const fromApi = data?.chartData?.sizes ?? [];
    if (preferenceSizes.length === 0) return fromApi;
    const ordered = [...preferenceSizes];
    const seen = new Set(preferenceSizes.map((s) => s.trim()));
    for (const s of fromApi) {
      const t = (s ?? '').trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        ordered.push(s);
      }
    }
    return ordered;
  }, [data?.chartData?.sizes, preferenceSizes]);

  return (
    <main className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* Header: title + refresh */}
        <Item variant="outline" size="sm" className="rounded-xl shadow-sm">
          <ItemHeader className="h-full">
            <div className="flex items-center gap-3">
              <ItemMedia variant="icon" className="rounded-lg">
                <BarChart3 className="text-primary h-5 w-5" />
              </ItemMedia>
              <ItemTitle className="font-custom text-sm font-semibold sm:text-base">
                Analytics
              </ItemTitle>
            </div>
            <ItemActions>
              <Button
                variant="outline"
                size="sm"
                className="font-custom focus-visible:ring-primary h-8 gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="Refresh analytics"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 shrink-0 ${isFetching ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </ItemActions>
          </ItemHeader>
        </Item>

        {/* Content */}
        <div className="min-h-[200px] w-full">
          {isLoading ? (
            <p className="font-custom text-sm text-gray-600">
              Loading storage summary…
            </p>
          ) : error ? (
            <p className="font-custom text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : 'Failed to load analytics'}
            </p>
          ) : data ? (
            <div className="space-y-6">
              {/* Stats: Total inventory, Top variety, Top size */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border rounded-xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-custom text-sm font-medium text-gray-600">
                      Total inventory (initial)
                    </CardTitle>
                    <Package className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-custom text-2xl font-bold text-[#333] tabular-nums">
                      {data.totalInventory.initial.toLocaleString('en-IN')}
                    </p>
                    <p className="font-custom text-muted-foreground text-xs">
                      Bags received
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border rounded-xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-custom text-sm font-medium text-gray-600">
                      Total inventory (current)
                    </CardTitle>
                    <Package className="text-primary h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-custom text-primary text-2xl font-bold tabular-nums">
                      {data.totalInventory.current.toLocaleString('en-IN')}
                    </p>
                    <p className="font-custom text-muted-foreground text-xs">
                      Bags in storage
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border rounded-xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-custom text-sm font-medium text-gray-600">
                      Top variety
                    </CardTitle>
                    <Wheat className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-custom text-lg font-semibold text-[#333]">
                      {data.topVariety?.variety ?? '—'}
                    </p>
                    <p className="font-custom text-muted-foreground text-xs tabular-nums">
                      {data.topVariety != null
                        ? `${data.topVariety.currentQuantity.toLocaleString('en-IN')} bags`
                        : 'No data'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border rounded-xl shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-custom text-sm font-medium text-gray-600">
                      Top bag size
                    </CardTitle>
                    <Ruler className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-custom text-lg font-semibold text-[#333]">
                      {data.topSize?.size ?? '—'}
                    </p>
                    <p className="font-custom text-muted-foreground text-xs tabular-nums">
                      {data.topSize != null
                        ? `${data.topSize.currentQuantity.toLocaleString('en-IN')} bags`
                        : 'No data'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Summary table */}
              <StorageSummaryTable
                stockSummary={data.stockSummary}
                sizes={sizesForTable}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
});

export default AnalyticsPage;
