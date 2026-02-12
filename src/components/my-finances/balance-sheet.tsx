import { memo, useMemo } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useGetBalanceSheet,
  type BalanceSheetBreakdownItem,
  type BalanceSheetAssetsSection,
  type BalanceSheetData,
  type GetBalanceSheetParams,
} from '@/services/accounting/useGetBalanceSheet';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface BSRow {
  label: string;
  amount: number | null;
  isHeader?: boolean;
  isTotal?: boolean;
  isProfit?: boolean;
}

/** Normalize a section (Record) into rows: supports { total, breakdown } or key-value pairs */
function sectionToRows(
  section: Record<string, unknown>,
  sectionLabel: string
): BSRow[] {
  const rows: BSRow[] = [];

  const breakdown = section.breakdown as
    | Array<{ name: string; balance: number }>
    | undefined;
  const total = section.total as number | undefined;

  if (Array.isArray(breakdown) && breakdown.length > 0) {
    rows.push({ label: sectionLabel, amount: null, isHeader: true });
    breakdown.forEach((item) => {
      rows.push({
        label: item.name,
        amount: item.balance ?? 0,
      });
    });
    if (typeof total === 'number') {
      rows.push({
        label: `Total ${sectionLabel}`,
        amount: total,
        isTotal: true,
      });
    }
  } else if (typeof total === 'number' && Object.keys(section).length > 0) {
    rows.push({ label: sectionLabel, amount: null, isHeader: true });
    rows.push({
      label: `Total ${sectionLabel}`,
      amount: total,
      isTotal: true,
    });
  } else {
    const entries = Object.entries(section).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && entry[0] !== 'total'
    );
    if (entries.length > 0) {
      rows.push({ label: sectionLabel, amount: null, isHeader: true });
      entries.forEach(([name, value]) => {
        rows.push({ label: name, amount: value });
      });
    }
  }

  return rows;
}

function assetsSectionToRows(
  section: BalanceSheetAssetsSection,
  sectionLabel: string
): BSRow[] {
  const rows: BSRow[] = [];
  rows.push({ label: sectionLabel, amount: null, isHeader: true });
  section.breakdown.forEach((item: BalanceSheetBreakdownItem) => {
    rows.push({ label: item.name, amount: item.balance });
  });
  rows.push({
    label: `Total ${sectionLabel}`,
    amount: section.total,
    isTotal: true,
  });
  return rows;
}

function buildRowsFromData(data: BalanceSheetData): {
  liabilityRows: BSRow[];
  assetRows: BSRow[];
  totalLiabilitiesAndEquity: number;
  totalAssets: number;
} {
  const liabilityRows: BSRow[] = [];
  const assetRows: BSRow[] = [];

  const { assets, liabilitiesAndEquity } = data;
  const le = liabilitiesAndEquity;

  /* Liabilities & Equity */
  const currentLiabilities = (le.currentLiabilities || {}) as Record<
    string,
    unknown
  >;
  const longTermLiabilities = (le.longTermLiabilities || {}) as Record<
    string,
    unknown
  >;
  const equity = (le.equity || {}) as Record<string, unknown>;

  liabilityRows.push(
    ...sectionToRows(currentLiabilities, 'Current Liabilities')
  );
  liabilityRows.push(
    ...sectionToRows(longTermLiabilities, 'Long Term Liabilities')
  );
  liabilityRows.push(...sectionToRows(equity, 'Equity'));

  const netProfit = le.netProfit ?? 0;
  const netLoss = le.netLoss ?? 0;
  if (netProfit > 0) {
    liabilityRows.push({
      label: 'Add: Profit',
      amount: netProfit,
      isProfit: true,
    });
  }
  if (netLoss > 0) {
    liabilityRows.push({
      label: 'Less: Loss',
      amount: netLoss,
      isProfit: false,
    });
  }

  const totalLiabilitiesAndEquity = le.total ?? 0;

  /* Assets */
  assetRows.push(...assetsSectionToRows(assets.fixedAssets, 'Fixed Assets'));
  assetRows.push(
    ...assetsSectionToRows(assets.currentAssets, 'Current Assets')
  );

  return {
    liabilityRows,
    assetRows,
    totalLiabilitiesAndEquity,
    totalAssets: assets.total,
  };
}

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface BalanceSheetProps {
  dateRange?: DateRange;
  /** When provided, parent owns data fetching; do not fetch inside this component */
  data?: BalanceSheetData | null;
  isLoading?: boolean;
  error?: Error | null;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const BalanceSheet = memo(function BalanceSheet({
  dateRange,
  data: dataProp,
  isLoading: isLoadingProp,
  error: errorProp,
}: BalanceSheetProps) {
  const params: GetBalanceSheetParams = useMemo(() => {
    const p: GetBalanceSheetParams = {};
    if (dateRange?.from) p.from = dateRange.from;
    if (dateRange?.to) p.to = dateRange.to;
    return p;
  }, [dateRange]);

  const query = useGetBalanceSheet(params);
  const data = dataProp !== undefined ? dataProp : query.data;
  const isLoading =
    isLoadingProp !== undefined ? isLoadingProp : query.isLoading;
  const isError = errorProp !== undefined ? !!errorProp : query.isError;
  const error = errorProp !== undefined ? errorProp : query.error;

  const tableData = useMemo(() => {
    if (!data) return null;
    return buildRowsFromData(data);
  }, [data]);

  if (isLoading) {
    return (
      <Card className="border-border/40 overflow-hidden shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <p className="font-custom text-muted-foreground text-center">
            Loading balance sheet...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/40 overflow-hidden shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <p className="font-custom text-destructive text-center">
            {error instanceof Error
              ? error.message
              : 'Failed to load balance sheet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !tableData) {
    return (
      <Card className="border-border/40 overflow-hidden shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <p className="font-custom text-muted-foreground text-center">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const { liabilityRows, assetRows, totalLiabilitiesAndEquity, totalAssets } =
    tableData;
  const maxRows = Math.max(liabilityRows.length, assetRows.length);
  const isBalanced = totalAssets === totalLiabilitiesAndEquity;

  return (
    <div className="space-y-6">
      <Card className="border-border/40 overflow-hidden shadow-sm">
        <CardHeader className="border-border/40 border-b pb-4">
          <h2 className="font-custom text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Balance Sheet
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border border-b-2 hover:bg-transparent">
                  <TableHead className="font-custom px-4 py-3 font-semibold">
                    Liabilities
                  </TableHead>
                  <TableHead className="font-custom border-border border-l border-dashed px-4 py-3 text-right font-semibold">
                    Amount
                  </TableHead>
                  <TableHead className="font-custom px-4 py-3 font-semibold">
                    Assets
                  </TableHead>
                  <TableHead className="font-custom px-4 py-3 text-right font-semibold">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: maxRows }).map((_, i) => {
                  const L = liabilityRows[i];
                  const A = assetRows[i];
                  return (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell
                        className={`font-custom px-4 py-2 ${L?.isHeader ? 'text-foreground font-semibold' : 'text-muted-foreground'} `}
                      >
                        {L?.label ?? '\u00A0'}
                      </TableCell>
                      <TableCell
                        className={`font-custom border-border border-l border-dashed px-4 py-2 text-right ${L?.isTotal ? 'text-foreground font-semibold' : ''} ${L?.isProfit !== undefined && L?.amount != null ? (L.isProfit ? 'font-semibold text-green-600 dark:text-green-400' : 'font-semibold text-red-600 dark:text-red-400') : ''} `}
                      >
                        {L?.amount != null
                          ? formatCurrency(L.amount)
                          : '\u00A0'}
                      </TableCell>
                      <TableCell
                        className={`font-custom px-4 py-2 ${A?.isHeader ? 'text-foreground font-semibold' : 'text-muted-foreground'} `}
                      >
                        {A?.label ?? '\u00A0'}
                      </TableCell>
                      <TableCell
                        className={`font-custom px-4 py-2 text-right ${A?.isTotal ? 'text-foreground font-semibold' : ''} `}
                      >
                        {A?.amount != null
                          ? formatCurrency(A.amount)
                          : '\u00A0'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-border bg-muted/50 hover:bg-muted/50 border-t-2 font-bold">
                  <TableCell className="font-custom px-4 py-3">Total</TableCell>
                  <TableCell className="font-custom border-border border-l border-dashed px-4 py-3 text-right">
                    {formatCurrency(totalLiabilitiesAndEquity)}
                  </TableCell>
                  <TableCell className="font-custom px-4 py-3">Total</TableCell>
                  <TableCell className="font-custom px-4 py-3 text-right">
                    {formatCurrency(totalAssets)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 overflow-hidden bg-gradient-to-br shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="font-custom text-foreground text-lg font-semibold">
            Balance Sheet Summary
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-border/60 bg-card rounded-lg border p-4">
              <p className="font-custom text-muted-foreground text-sm">
                Total Assets
              </p>
              <p className="font-custom text-primary text-xl font-bold">
                {formatCurrency(totalAssets)}
              </p>
            </div>
            <div className="border-border/60 bg-card rounded-lg border p-4">
              <p className="font-custom text-muted-foreground text-sm">
                Total Liabilities & Equity
              </p>
              <p className="font-custom text-primary text-xl font-bold">
                {formatCurrency(totalLiabilitiesAndEquity)}
              </p>
            </div>
            <div className="border-border/60 bg-card rounded-lg border p-4">
              <p className="font-custom text-muted-foreground text-sm">
                Balance Sheet Status
              </p>
              <p
                className={`font-custom text-xl font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
              >
                {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default BalanceSheet;
