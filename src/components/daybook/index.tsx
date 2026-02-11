import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';

import { Card } from '@/components/ui/card';
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
  PaginationLink,
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
  ClipboardList,
  Package,
  Truck,
} from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyContent,
  EmptyMedia,
} from '@/components/ui/empty';

/* ------------------------------------------------------------------ */
/* Fake Data */
/* ------------------------------------------------------------------ */

const MOCK_ENTRIES = Array.from({ length: 3 });

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
/* Entry Card (UI only) */
/* ------------------------------------------------------------------ */

const DaybookEntryCard = memo(function DaybookEntryCard() {
  return (
    <Card className="overflow-hidden p-0">
      {/* Pipeline */}
      <div className="border-border bg-muted/30 px-4 py-3">
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>Pipeline</span>
          <span>60%</span>
        </div>
        <Progress value={60} className="mt-2 h-2" />
      </div>

      {/* Summary */}
      <div className="border-b px-4 py-3 text-sm">
        <div className="flex gap-6">
          <span>Bags: 120</span>
          <span>Stored: 80</span>
          <span>Dispatch: 20</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="incoming">Incoming</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="nikasi">Dispatch</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>

        {/* Incoming */}
        <TabsContent value="incoming">
          <div className="p-4 text-sm">
            Incoming voucher information goes here.
          </div>
        </TabsContent>

        {/* Grading */}
        <TabsContent value="grading">
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No grading voucher</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <a href="#">Add Grading Voucher</a>
              </Button>
            </EmptyContent>
          </Empty>
        </TabsContent>

        {/* Storage */}
        <TabsContent value="storage">
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No storage voucher</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <a href="#">Add Storage Voucher</a>
              </Button>
            </EmptyContent>
          </Empty>
        </TabsContent>

        {/* Dispatch */}
        <TabsContent value="nikasi">
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Truck />
              </EmptyMedia>
              <EmptyTitle>No dispatch voucher</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <a href="#">Add Dispatch Voucher</a>
              </Button>
            </EmptyContent>
          </Empty>
        </TabsContent>

        {/* Outgoing */}
        <TabsContent value="outgoing">
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ArrowRightFromLine />
              </EmptyMedia>
              <EmptyTitle>No outgoing voucher</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <a href="#">Add Outgoing Voucher</a>
              </Button>
            </EmptyContent>
          </Empty>
        </TabsContent>
      </Tabs>
    </Card>
  );
});

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

const DaybookPage = memo(function DaybookPage() {
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

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
              <ItemTitle>24 vouchers</ItemTitle>
            </div>

            <ItemActions>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
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
          {/* Search */}
          <div className="relative w-full">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by voucher number, date..."
              className="font-custom focus-visible:ring-primary w-full pl-10 focus-visible:ring-2 focus-visible:ring-offset-2"
            />
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

        {/* Cards */}
        <div className="space-y-6">
          {MOCK_ENTRIES.map((_, i) => (
            <DaybookEntryCard key={i} />
          ))}
        </div>

        {/* Pagination */}
        <Item variant="outline" className="justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                10 per page
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {LIMIT_OPTIONS.map((n) => (
                <DropdownMenuItem key={n}>{n} per page</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink isActive href="#">
                  1 / 5
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Item>
      </div>
    </main>
  );
});

export default DaybookPage;
