import { memo, useState, useMemo } from 'react';
import { useGetAllLedgers } from '@/services/accounting/useGetAllLedgers';
import { DataTable } from '@/components/ui/data-table';
import { ledgersColumns } from './ledgers-columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

const LedgerTab = memo(function LedgerTab() {
  const { data: ledgers, isLoading, isError, error } = useGetAllLedgers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLedgers = useMemo(() => {
    const list = ledgers ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((ledger) =>
      ledger.name.toLowerCase().includes(q)
    );
  }, [ledgers, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="font-custom text-destructive">
        {error instanceof Error ? error.message : 'Failed to load ledgers.'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by ledger name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="font-custom focus-visible:ring-primary w-full pl-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="font-custom focus-visible:ring-primary h-10 w-full gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto">
              <Plus className="h-4 w-4 shrink-0" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="font-custom sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Ledger</DialogTitle>
            </DialogHeader>
            <p className="font-custom text-muted-foreground py-4">
              Display content here
            </p>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={ledgersColumns} data={filteredLedgers} />
    </div>
  );
});

export default LedgerTab;
