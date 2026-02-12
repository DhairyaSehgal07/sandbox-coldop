import { memo, useState } from 'react';

import {
  Item,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  ItemActions,
  ItemFooter,
} from '@/components/ui/item';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Wallet,
  RefreshCw,
  ChevronDown,
  FileText,
  Receipt,
  BookOpen,
  List,
  BarChart3,
  Calculator,
} from 'lucide-react';

import VoucherTab from './vouchers-tab';
import LedgerTab from './ledgers-tab';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type PeriodFilter = 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  this_month: 'This month',
  last_month: 'Last month',
  this_quarter: 'This quarter',
  this_year: 'This year',
};

const TAB_TRIGGER_CLASS =
  'font-custom relative flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ' +
  'text-muted-foreground hover:text-foreground ' +
  'data-[state=active]:bg-background data-[state=active]:text-foreground ' +
  'data-[state=active]:shadow-sm ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

/* ------------------------------------------------------------------ */
/* Skeleton loader */
/* ------------------------------------------------------------------ */

function MyFinancesSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border/40 overflow-hidden shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/40 overflow-hidden">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page component */
/* ------------------------------------------------------------------ */

const MyFinancesPage = memo(function MyFinancesPage() {
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Placeholder: no API yet – use false to show content, true for loading
  const isLoading = false;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <MyFinancesSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* Header: title + refresh */}
        <Item variant="outline" size="sm" className="rounded-xl shadow-sm">
          <ItemHeader className="h-full">
            <div className="flex items-center gap-3">
              <ItemMedia variant="icon" className="rounded-lg">
                <Wallet className="text-primary h-5 w-5" />
              </ItemMedia>
              <ItemTitle className="font-custom text-sm font-semibold sm:text-base">
                My Finances
              </ItemTitle>
            </div>
            <ItemActions>
              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="font-custom focus-visible:ring-primary h-8 gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-busy={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 shrink-0 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </ItemActions>
          </ItemHeader>
        </Item>

        {/* Period filter + actions */}
        <Item
          variant="outline"
          size="sm"
          className="flex-col items-stretch gap-4 rounded-xl"
        >
          <ItemFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-custom focus-visible:ring-primary h-8 w-full gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Period: {PERIOD_LABELS[period]}
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="font-custom">
                {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={period === key}
                    onCheckedChange={() => setPeriod(key)}
                  >
                    {PERIOD_LABELS[key]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <Button
                variant="secondary"
                size="sm"
                className="font-custom focus-visible:ring-primary h-8 gap-2 rounded-lg px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                asChild
              >
                <a href="#">
                  <FileText className="h-4 w-4 shrink-0" />
                  Get reports
                </a>
              </Button>
            </div>
          </ItemFooter>
        </Item>

        {/* Tabs */}
        <Tabs defaultValue="vouchers" className="w-full space-y-4">
          <TabsList className="font-custom bg-muted inline-flex h-auto w-full items-center justify-start gap-1 rounded-2xl p-1">
            <TabsTrigger value="vouchers" className={TAB_TRIGGER_CLASS}>
              <Receipt className="mr-2 h-4 w-4 shrink-0" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="ledgers" className={TAB_TRIGGER_CLASS}>
              <BookOpen className="mr-2 h-4 w-4 shrink-0" />
              Ledgers
            </TabsTrigger>
            <TabsTrigger value="ledger-view" className={TAB_TRIGGER_CLASS}>
              <List className="mr-2 h-4 w-4 shrink-0" />
              Ledger View
            </TabsTrigger>
            <TabsTrigger
              value="financial-statements"
              className={TAB_TRIGGER_CLASS}
            >
              <BarChart3 className="mr-2 h-4 w-4 shrink-0" />
              Financial Statements
            </TabsTrigger>
            <TabsTrigger value="closing-balances" className={TAB_TRIGGER_CLASS}>
              <Calculator className="mr-2 h-4 w-4 shrink-0" />
              Closing Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vouchers" className="outline-none">
            <Card className="border-border/50 rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <VoucherTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ledgers" className="outline-none">
            <Card className="border-border/50 rounded-2xl py-4 shadow-sm">
              <CardContent className="p-4">
                <LedgerTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ledger-view" className="outline-none">
            <Card className="border-border/50 rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <p className="font-custom text-muted-foreground">
                  Ledger View content
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="financial-statements" className="outline-none">
            <Card className="border-border/50 rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <p className="font-custom text-muted-foreground">
                  Financial Statements content
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="closing-balances" className="outline-none">
            <Card className="border-border/50 rounded-2xl shadow-sm">
              <CardContent className="pt-6">
                <p className="font-custom text-muted-foreground">
                  Closing Balances content
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
});

export default MyFinancesPage;
