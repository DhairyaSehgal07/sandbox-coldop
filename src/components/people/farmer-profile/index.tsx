import { useMemo, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Item,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  ItemActions,
  ItemFooter,
} from '@/components/ui/item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  ChevronDown,
  RefreshCw,
  Receipt,
  ArrowUpFromLine,
  ArrowDownToLine,
  Hash,
  Package,
  Edit,
} from 'lucide-react';
import type { FarmerStorageLink } from '@/types/farmer';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';
import { useGetFarmerOrders } from '@/services/store-admin/functions/useGetFarmerOrders';
import IncomingGatePassCard from '@/components/daybook/incoming-gate-pass-card';
import OutgoingGatePassCard from '@/components/daybook/outgoing-gate-pass-card';

/* ------------------------------------------------------------------ */
/* Types – same as daybook screen */
/* ------------------------------------------------------------------ */

type OrderFilter = 'all' | 'incoming' | 'outgoing';
type SortOrder = 'latest' | 'oldest';

const ORDER_LABELS: Record<OrderFilter, string> = {
  all: 'All Orders',
  incoming: 'Incoming',
  outgoing: 'Outgoing',
};

const SORT_LABELS: Record<SortOrder, string> = {
  latest: 'Latest First',
  oldest: 'Oldest First',
};

export interface FarmerProfilePageProps {
  farmerStorageLinkId: string;
}

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function totalBagsIncoming(entry: DaybookEntry): number {
  const bagSizes = entry.bagSizes ?? [];
  return bagSizes.reduce((s, b) => s + (b.initialQuantity ?? 0), 0);
}

function totalBagsOutgoing(entry: DaybookEntry): number {
  const orderDetails = entry.orderDetails ?? [];
  return orderDetails.reduce((s, d) => s + (d.quantityIssued ?? 0), 0);
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

const FarmerProfilePage = ({ farmerStorageLinkId }: FarmerProfilePageProps) => {
  const link = useRouterState({
    select: (state) =>
      (state.location.state as { link?: FarmerStorageLink } | undefined)?.link,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useGetFarmerOrders(farmerStorageLinkId);

  const incoming = useMemo(
    () => ordersData?.incoming ?? [],
    [ordersData?.incoming]
  );
  const outgoing = useMemo(
    () => ordersData?.outgoing ?? [],
    [ordersData?.outgoing]
  );

  const combinedEntries: DaybookEntry[] = useMemo(() => {
    const inc: DaybookEntry[] = incoming.map((e) => ({
      ...e,
      type: 'RECEIPT' as const,
    }));
    const out: DaybookEntry[] = outgoing.map((e) => ({
      ...e,
      type: 'DELIVERY' as const,
    }));
    return [...inc, ...out];
  }, [incoming, outgoing]);

  const filteredAndSortedEntries = useMemo(() => {
    let list = combinedEntries;

    if (orderFilter === 'incoming') {
      list = list.filter((e) => e.type === 'RECEIPT');
    } else if (orderFilter === 'outgoing') {
      list = list.filter((e) => e.type === 'DELIVERY');
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      list = list.filter((entry) => {
        const farmerName =
          entry.farmerStorageLinkId?.farmerId?.name?.toLowerCase() ?? '';
        const voucherNo = String(entry.gatePassNo ?? '');
        const date = entry.date
          ? new Date(entry.date).toLocaleDateString('en-IN')
          : '';
        return (
          farmerName.includes(normalizedQuery) ||
          voucherNo.includes(normalizedQuery) ||
          date.includes(normalizedQuery)
        );
      });
    }

    list = [...list].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [combinedEntries, searchQuery, sortOrder, orderFilter]);

  const totalCount = filteredAndSortedEntries.length;

  const aggregateStats = useMemo(() => {
    const totalIncomingBags = incoming.reduce(
      (sum, entry) => sum + totalBagsIncoming(entry),
      0
    );
    const totalOutgoingBags = outgoing.reduce(
      (sum, entry) => sum + totalBagsOutgoing(entry),
      0
    );
    return {
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      totalIncomingBags,
      totalOutgoingBags,
    };
  }, [incoming, outgoing]);

  if (!link) {
    return (
      <main className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
        <p className="font-custom text-muted-foreground">Farmer not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* Farmer info card */}
        <Card className="overflow-hidden rounded-xl shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 shadow-md sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-custom text-xl font-bold sm:text-2xl">
                      {getInitials(link.farmerId.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h1 className="font-custom text-xl font-bold tracking-tight sm:text-2xl">
                      {link.farmerId.name}
                    </h1>
                    <Badge variant="secondary" className="font-custom w-fit">
                      <Hash className="mr-1 h-3 w-3" />
                      {link.accountNumber}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  aria-label="Edit farmer"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="default"
                  className="font-custom gap-2 rounded-lg"
                >
                  <Package className="h-4 w-4" />
                  View Stock Ledger
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <ArrowUpFromLine className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-custom text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Incoming
                    </p>
                    <p className="font-custom text-lg font-bold">
                      {aggregateStats.incomingCount} vouchers
                    </p>
                    <p className="font-custom text-muted-foreground text-sm">
                      {aggregateStats.totalIncomingBags.toLocaleString('en-IN')}{' '}
                      bags
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <ArrowDownToLine className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-custom text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Outgoing
                    </p>
                    <p className="font-custom text-lg font-bold">
                      {aggregateStats.outgoingCount} vouchers
                    </p>
                    <p className="font-custom text-muted-foreground text-sm">
                      {aggregateStats.totalOutgoingBags.toLocaleString('en-IN')}{' '}
                      bags
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header: order count + refresh */}
        <Item variant="outline" size="sm" className="rounded-xl shadow-sm">
          <ItemHeader className="h-full">
            <div className="flex items-center gap-3">
              <ItemMedia variant="icon" className="rounded-lg">
                <Receipt className="text-primary h-5 w-5" />
              </ItemMedia>
              <ItemTitle className="font-custom text-sm font-semibold sm:text-base">
                {totalCount} {totalCount === 1 ? 'voucher' : 'vouchers'}
              </ItemTitle>
            </div>
            <ItemActions>
              <Button
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => refetch()}
                className="font-custom h-8 gap-2 rounded-lg px-3"
              >
                <RefreshCw
                  className={`h-4 w-4 shrink-0 ${
                    isFetching ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </ItemActions>
          </ItemHeader>
        </Item>

        {/* Search + sort + filter */}
        <Item
          variant="outline"
          size="sm"
          className="flex-col items-stretch gap-4 rounded-xl"
        >
          <div className="relative w-full">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by voucher number, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-custom focus-visible:ring-primary w-full pl-10 focus-visible:ring-2 focus-visible:ring-offset-2"
            />
          </div>
          <ItemFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4">
              {/* Orders filter – same as daybook */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-custom focus-visible:ring-primary h-8 w-full gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Orders: {ORDER_LABELS[orderFilter]}
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="font-custom">
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'all'}
                    onCheckedChange={() => setOrderFilter('all')}
                  >
                    All Orders
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'incoming'}
                    onCheckedChange={() => setOrderFilter('incoming')}
                  >
                    Incoming
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'outgoing'}
                    onCheckedChange={() => setOrderFilter('outgoing')}
                  >
                    Outgoing
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort – same as daybook */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-custom focus-visible:ring-primary h-8 w-full gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Sort: {SORT_LABELS[sortOrder]}
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="font-custom">
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === 'latest'}
                    onCheckedChange={() => setSortOrder('latest')}
                  >
                    Latest First
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === 'oldest'}
                    onCheckedChange={() => setSortOrder('oldest')}
                  >
                    Oldest First
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ItemFooter>
        </Item>

        {/* List: vouchers */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="border-border/40 overflow-hidden pt-0 shadow-sm"
              >
                <div className="w-full px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="min-w-0 space-y-1">
                        <Skeleton className="h-3.5 w-14" />
                        <Skeleton className="h-4 w-full max-w-28" />
                      </div>
                    ))}
                  </div>
                  <div className="border-border/50 mt-4 flex w-full items-center justify-between border-t pt-4">
                    <Skeleton className="h-8 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 pt-6 text-center">
              <p className="font-custom text-muted-foreground">
                No vouchers yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full space-y-4">
            {filteredAndSortedEntries.map((entry, idx) =>
              entry.type === 'RECEIPT' ? (
                <IncomingGatePassCard
                  key={entry._id ?? `inc-${idx}`}
                  entry={entry}
                />
              ) : (
                <OutgoingGatePassCard
                  key={entry._id ?? `out-${idx}`}
                  entry={entry}
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default FarmerProfilePage;
