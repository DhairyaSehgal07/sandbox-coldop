import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';

// import { Card } from '@/components/ui/card'; // used in DaybookEntryCard (commented)
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import {
  Search,
  ChevronDown,
  RefreshCw,
  Receipt,
  ArrowUpFromLine,
  ArrowRightFromLine,
  FileText,
} from 'lucide-react';

// Used in commented DaybookEntryCard – uncomment when cards are re-enabled:
// ClipboardList, Package, Truck
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// import { Progress } from '@/components/ui/progress';
// import { Empty, EmptyHeader, EmptyTitle, EmptyContent, EmptyMedia } from '@/components/ui/empty';

import { useGetDaybook } from '@/services/store-admin/functions/useGetDaybook';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';
import { useSearchDaybook } from '@/services/store-admin/functions/useSearchDaybook';
import IncomingGatePassCard from '@/components/daybook/incoming-gate-pass-card';
import OutgoingGatePassCard from '@/components/daybook/outgoing-gate-pass-card';

/* ------------------------------------------------------------------ */
/* Fake Data */
/* ------------------------------------------------------------------ */

const LIMIT_OPTIONS = [10, 25, 50, 100];

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

/* ------------------------------------------------------------------ */
/* Entry Card (UI only) – commented out for now, show JSON instead */
/* ------------------------------------------------------------------ */

// const DaybookEntryCard = memo(function DaybookEntryCard() {
//   return (
//     <Card className="overflow-hidden p-0">
//       {/* Pipeline */}
//       <div className="border-border bg-muted/30 px-4 py-3">
//         <div className="text-muted-foreground flex justify-between text-sm">
//           <span>Pipeline</span>
//           <span>60%</span>
//         </div>
//         <Progress value={60} className="mt-2 h-2" />
//       </div>
//
//       {/* Summary */}
//       <div className="border-b px-4 py-3 text-sm">
//         <div className="flex gap-6">
//           <span>Bags: 120</span>
//           <span>Stored: 80</span>
//           <span>Dispatch: 20</span>
//         </div>
//       </div>
//
//       {/* Tabs */}
//       <Tabs defaultValue="incoming">
//         <TabsList className="w-full overflow-x-auto">
//           <TabsTrigger value="incoming">Incoming</TabsTrigger>
//           <TabsTrigger value="grading">Grading</TabsTrigger>
//           <TabsTrigger value="storage">Storage</TabsTrigger>
//           <TabsTrigger value="nikasi">Dispatch</TabsTrigger>
//           <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
//         </TabsList>
//
//         {/* Incoming */}
//         <TabsContent value="incoming">
//           <div className="p-4 text-sm">
//             Incoming voucher information goes here.
//           </div>
//         </TabsContent>
//
//         {/* Grading */}
//         <TabsContent value="grading">
//           <Empty className="py-8">
//             <EmptyHeader>
//               <EmptyMedia variant="icon">
//                 <ClipboardList />
//               </EmptyMedia>
//               <EmptyTitle>No grading voucher</EmptyTitle>
//             </EmptyHeader>
//             <EmptyContent>
//               <Button asChild>
//                 <a href="#">Add Grading Voucher</a>
//               </Button>
//             </EmptyContent>
//           </Empty>
//         </TabsContent>
//
//         {/* Storage */}
//         <TabsContent value="storage">
//           <Empty className="py-8">
//             <EmptyHeader>
//               <EmptyMedia variant="icon">
//                 <Package />
//               </EmptyMedia>
//               <EmptyTitle>No storage voucher</EmptyTitle>
//             </EmptyHeader>
//             <EmptyContent>
//               <Button asChild>
//                 <a href="#">Add Storage Voucher</a>
//               </Button>
//             </EmptyContent>
//           </Empty>
//         </TabsContent>
//
//         {/* Dispatch */}
//         <TabsContent value="nikasi">
//           <Empty className="py-8">
//             <EmptyHeader>
//               <EmptyMedia variant="icon">
//                 <Truck />
//               </EmptyMedia>
//               <EmptyTitle>No dispatch voucher</EmptyTitle>
//             </EmptyHeader>
//             <EmptyContent>
//               <Button asChild>
//                 <a href="#">Add Dispatch Voucher</a>
//               </Button>
//             </EmptyContent>
//           </Empty>
//         </TabsContent>
//
//         {/* Outgoing */}
//         <TabsContent value="outgoing">
//           <Empty className="py-8">
//             <EmptyHeader>
//               <EmptyMedia variant="icon">
//                 <ArrowRightFromLine />
//               </EmptyMedia>
//               <EmptyTitle>No outgoing voucher</EmptyTitle>
//             </EmptyHeader>
//             <EmptyContent>
//               <Button asChild>
//                 <a href="#">Add Outgoing Voucher</a>
//               </Button>
//             </EmptyContent>
//           </Empty>
//         </TabsContent>
//       </Tabs>
//     </Card>
//   );
// });

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

const DaybookPage = memo(function DaybookPage() {
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchReceipt, setSearchReceipt] = useState('');

  const { data, isLoading, isError, error, refetch } = useGetDaybook({
    type: orderFilter,
    sortBy: sortOrder,
    page,
    limit,
  });

  const searchDaybook = useSearchDaybook();
  const searchResult = searchDaybook.data;
  const isSearchMode = searchResult !== undefined;

  const handleSearchReceiptChange = (value: string) => {
    setSearchReceipt(value.replace(/\D/g, ''));
  };

  const handleSearchSubmit = () => {
    const trimmed = searchReceipt.trim();
    if (trimmed) {
      searchDaybook.mutate({ receiptNumber: trimmed });
    }
  };

  const handleClearSearch = () => {
    searchDaybook.reset();
    setSearchReceipt('');
  };

  const pagination = data?.pagination;
  const hasPreviousPage = pagination?.hasPreviousPage ?? false;
  const hasNextPage = pagination?.hasNextPage ?? false;
  const currentPage = pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const handleOrderFilterChange = (value: OrderFilter) => {
    setOrderFilter(value);
    setPage(1);
  };

  const handleSortOrderChange = (value: SortOrder) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const entries: DaybookEntry[] = isSearchMode
    ? [...(searchResult?.incoming ?? []), ...(searchResult?.outgoing ?? [])]
    : (data?.data ?? []);

  return (
    <main className="mx-auto max-w-7xl p-4">
      <div className="space-y-6">
        {/* Header */}
        <Item variant="outline">
          <ItemHeader>
            <div className="flex items-center gap-3">
              <ItemMedia variant="icon">
                <Receipt />
              </ItemMedia>
              <ItemTitle>
                {data?.pagination != null
                  ? `${data.pagination.totalItems} vouchers`
                  : 'Daybook'}
              </ItemTitle>
            </div>

            <ItemActions>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </ItemActions>
          </ItemHeader>
        </Item>

        {/* Search / Filters */}
        <Item
          variant="outline"
          size="sm"
          className="flex-col items-stretch gap-4 rounded-xl"
        >
          {/* Search by receipt number (numbers only) */}
          <div className="relative flex w-full gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Search by receipt number"
                value={searchReceipt}
                onChange={(e) => handleSearchReceiptChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                className="font-custom focus-visible:ring-primary w-full pl-10 focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="Search by receipt number (numbers only)"
              />
            </div>
            <Button
              variant="default"
              size="default"
              className="font-custom focus-visible:ring-primary shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={handleSearchSubmit}
              disabled={!searchReceipt.trim() || searchDaybook.isPending}
            >
              {searchDaybook.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
            {isSearchMode && (
              <Button
                variant="outline"
                size="default"
                className="font-custom focus-visible:ring-primary shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            )}
          </div>

          <ItemFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-4">
              {/* Orders filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-custom focus-visible:ring-primary w-full min-w-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:min-w-40"
                  >
                    <span className="hidden sm:inline">Orders: </span>
                    <span className="sm:hidden">Orders: </span>
                    {ORDER_LABELS[orderFilter]}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="font-custom">
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'all'}
                    onCheckedChange={() => handleOrderFilterChange('all')}
                  >
                    All Orders
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'incoming'}
                    onCheckedChange={() => handleOrderFilterChange('incoming')}
                  >
                    Incoming
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={orderFilter === 'outgoing'}
                    onCheckedChange={() => handleOrderFilterChange('outgoing')}
                  >
                    Outgoing
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Latest / Oldest sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-custom focus-visible:ring-primary w-full min-w-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:min-w-40"
                  >
                    <span className="hidden sm:inline">Sort: </span>
                    <span className="sm:hidden">Sort: </span>
                    {SORT_LABELS[sortOrder]}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="font-custom">
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === 'latest'}
                    onCheckedChange={() => handleSortOrderChange('latest')}
                  >
                    Latest First
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === 'oldest'}
                    onCheckedChange={() => handleSortOrderChange('oldest')}
                  >
                    Oldest First
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Action buttons */}
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <Button
                className="font-custom h-10 w-full shrink-0 sm:w-auto"
                asChild
              >
                <Link to="/store-admin/incoming">
                  <ArrowUpFromLine className="h-4 w-4 shrink-0" />
                  Add Incoming
                </Link>
              </Button>
              <Button
                variant="secondary"
                className="font-custom h-10 w-full shrink-0 sm:w-auto"
                asChild
              >
                <Link to="/store-admin/outgoing">
                  <ArrowRightFromLine className="h-4 w-4 shrink-0" />
                  Add Outgoing
                </Link>
              </Button>
              <Button
                variant="secondary"
                className="font-custom h-10 w-full shrink-0 sm:w-auto"
                asChild
              >
                <a href="#">
                  <FileText className="h-4 w-4 shrink-0" />
                  Get Reports
                </a>
              </Button>
            </div>
          </ItemFooter>
        </Item>

        {/* Search results or Daybook list */}
        <div className="min-h-[120px] w-full">
          {isSearchMode && searchDaybook.isError && (
            <p className="font-custom text-destructive text-sm">
              Search failed. Please try again.
            </p>
          )}
          {!isSearchMode && isLoading && (
            <p className="font-custom text-muted-foreground text-sm">
              Loading…
            </p>
          )}
          {!isSearchMode && isError && (
            <p className="font-custom text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : 'Failed to load daybook'}
            </p>
          )}
          {!isSearchMode && !isLoading && !isError && entries.length === 0 && (
            <p className="font-custom text-muted-foreground text-sm">
              No vouchers to show.
            </p>
          )}
          {isSearchMode && searchResult != null && entries.length === 0 && (
            <p className="font-custom text-muted-foreground text-sm">
              No vouchers found for this receipt number.
            </p>
          )}
          {((!isSearchMode && !isLoading && !isError) || isSearchMode) &&
            entries.length > 0 && (
              <div className="w-full space-y-4">
                {entries.map((entry) =>
                  entry.type === 'RECEIPT' ? (
                    <IncomingGatePassCard key={entry._id} entry={entry} />
                  ) : (
                    <OutgoingGatePassCard key={entry._id} entry={entry} />
                  )
                )}
              </div>
            )}
        </div>

        {/* Pagination (hidden when showing search results) */}
        {!isSearchMode && (
          <Item
            variant="outline"
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {limit} per page
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="font-custom">
                {LIMIT_OPTIONS.map((n) => (
                  <DropdownMenuItem
                    key={n}
                    onClick={() => handleLimitChange(n)}
                  >
                    {n} per page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasPreviousPage && pagination?.previousPage != null) {
                        setPage(pagination.previousPage);
                      }
                    }}
                    aria-disabled={!hasPreviousPage}
                    className={
                      !hasPreviousPage
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                  />
                </PaginationItem>

                <PaginationItem>
                  <span className="font-custom px-4 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (hasNextPage && pagination?.nextPage != null) {
                        setPage(pagination.nextPage);
                      }
                    }}
                    aria-disabled={!hasNextPage}
                    className={
                      !hasNextPage
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Item>
        )}
      </div>
    </main>
  );
});

export default DaybookPage;
