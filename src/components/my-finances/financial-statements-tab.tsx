import { memo, useMemo } from 'react';

import { useGetBalanceSheet } from '@/services/accounting/useGetBalanceSheet';
import { useGetAllLedgers } from '@/services/accounting/ledgers/useGetAllLedgers';

import BalanceSheet from './balance-sheet';
import TradingAndPLAccount from './tradingAndPLAccount';

const FinancialStatementsTab = memo(function FinancialStatementsTab() {
  const params = useMemo(() => ({}), []);

  const {
    data: balanceSheetData,
    isLoading: balanceSheetLoading,
    isError: balanceSheetError,
    error: balanceSheetErr,
  } = useGetBalanceSheet(params);
  const {
    data: ledgers = [],
    isLoading: ledgersLoading,
    isError: ledgersError,
    error: ledgersErr,
  } = useGetAllLedgers(params);

  return (
    <div className="space-y-6">
      <BalanceSheet
        data={balanceSheetData}
        isLoading={balanceSheetLoading}
        error={
          balanceSheetError
            ? (balanceSheetErr ?? new Error('Failed to load balance sheet'))
            : null
        }
      />
      <TradingAndPLAccount
        ledgers={ledgers}
        isLoading={ledgersLoading}
        error={
          ledgersError
            ? (ledgersErr ?? new Error('Failed to load ledgers'))
            : null
        }
      />
    </div>
  );
});

export default FinancialStatementsTab;
