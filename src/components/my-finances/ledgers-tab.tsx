import { memo, useState, useMemo, useCallback } from 'react';
import {
  useGetAllLedgers,
  type Ledger,
} from '@/services/accounting/ledgers/useGetAllLedgers';
import { useCreateLedger } from '@/services/accounting/ledgers/useCreateLedger';
import type { CreateLedgerBody } from '@/services/accounting/ledgers/useCreateLedger';
import { useUpdateLedger } from '@/services/accounting/ledgers/useUpdateLedger';
import type { UpdateLedgerBody } from '@/services/accounting/ledgers/useUpdateLedger';
import { useDeleteLedger } from '@/services/accounting/ledgers/useDeleteLeger';
import { DataTable } from '@/components/ui/data-table';
import { getLedgersColumns } from './ledgers-columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search } from 'lucide-react';

const LEDGER_TYPES: CreateLedgerBody['type'][] = [
  'Asset',
  'Liability',
  'Income',
  'Expense',
  'Equity',
];

const LedgerTab = memo(function LedgerTab() {
  const { data: ledgers, isLoading, isError, error } = useGetAllLedgers();
  const createLedger = useCreateLedger();
  const updateLedger = useUpdateLedger();
  const deleteLedger = useDeleteLedger();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateLedgerBody>({
    name: '',
    type: 'Asset',
    subType: '',
    category: '',
    openingBalance: undefined,
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ledgerToEdit, setLedgerToEdit] = useState<Ledger | null>(null);
  const [editForm, setEditForm] = useState<UpdateLedgerBody>({
    name: '',
    type: 'Asset',
    subType: '',
    category: '',
    openingBalance: undefined,
  });
  const [ledgerToDelete, setLedgerToDelete] = useState<Ledger | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateLedgerBody = {
      name: form.name,
      type: form.type,
      subType: form.subType,
      category: form.category,
    };
    if (
      form.openingBalance !== undefined &&
      !Number.isNaN(form.openingBalance)
    ) {
      payload.openingBalance = form.openingBalance;
    }
    createLedger.mutate(payload, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({
          name: '',
          type: 'Asset',
          subType: '',
          category: '',
          openingBalance: undefined,
        });
      },
    });
  };

  const handleEditClick = useCallback((ledger: Ledger) => {
    setLedgerToEdit(ledger);
    setEditForm({
      name: ledger.name,
      type: ledger.type,
      subType: ledger.subType,
      category: ledger.category,
      openingBalance: ledger.openingBalance,
    });
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((ledger: Ledger) => {
    setLedgerToDelete(ledger);
  }, []);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerToEdit) return;
    const payload: UpdateLedgerBody = {
      name: editForm.name,
      type: editForm.type,
      subType: editForm.subType,
      category: editForm.category,
    };
    if (
      editForm.openingBalance !== undefined &&
      !Number.isNaN(editForm.openingBalance)
    ) {
      payload.openingBalance = editForm.openingBalance;
    }
    updateLedger.mutate(
      { ledgerId: ledgerToEdit._id, ...payload },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setLedgerToEdit(null);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!ledgerToDelete) return;
    deleteLedger.mutate(ledgerToDelete._id, {
      onSuccess: () => setLedgerToDelete(null),
    });
  };

  const columns = useMemo(
    () =>
      getLedgersColumns({
        onEdit: handleEditClick,
        onDelete: handleDeleteClick,
      }),
    [handleEditClick, handleDeleteClick]
  );

  const filteredLedgers = useMemo(() => {
    const list = ledgers ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((ledger) => ledger.name.toLowerCase().includes(q));
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
    <div className="space-y-3">
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <form
              onSubmit={handleCreateSubmit}
              className="font-custom flex flex-col gap-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="ledger-name">Name</Label>
                <Input
                  id="ledger-name"
                  placeholder="e.g. Bank, Cash"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-type">Type</Label>
                <select
                  id="ledger-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as CreateLedgerBody['type'],
                    }))
                  }
                  className="border-input bg-background ring-offset-background focus-visible:ring-primary font-custom flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {LEDGER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-subType">Sub type</Label>
                <Input
                  id="ledger-subType"
                  placeholder="e.g. Current Asset"
                  value={form.subType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subType: e.target.value }))
                  }
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-category">Category</Label>
                <Input
                  id="ledger-category"
                  placeholder="e.g. Cash"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-openingBalance">
                  Opening balance (optional)
                </Label>
                <Input
                  id="ledger-openingBalance"
                  type="number"
                  step="any"
                  placeholder="0"
                  value={form.openingBalance ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      openingBalance:
                        v === ''
                          ? undefined
                          : (() => {
                              const n = parseFloat(v);
                              return Number.isNaN(n) ? undefined : n;
                            })(),
                    }));
                  }}
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  disabled={createLedger.isPending}
                >
                  {createLedger.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <AlertDialog
        open={!!ledgerToDelete}
        onOpenChange={(open) => !open && setLedgerToDelete(null)}
      >
        <AlertDialogContent className="font-custom">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ledger?</AlertDialogTitle>
            <AlertDialogDescription>
              {ledgerToDelete ? (
                <>
                  This will permanently delete the ledger &quot;
                  {ledgerToDelete.name}&quot;. This action cannot be undone.
                  Ledgers with existing transactions cannot be deleted.
                </>
              ) : (
                'This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="font-custom sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Ledger</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit}
            className="font-custom flex flex-col gap-4 pt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-ledger-name">Name</Label>
              <Input
                id="edit-ledger-name"
                placeholder="e.g. Bank, Cash"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                required
                disabled={ledgerToEdit?.isSystemLedger ?? false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ledger-type">Type</Label>
              <select
                id="edit-ledger-type"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    type: e.target.value as UpdateLedgerBody['type'],
                  }))
                }
                className="border-input bg-background ring-offset-background focus-visible:ring-primary font-custom flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={ledgerToEdit?.isSystemLedger ?? false}
              >
                {LEDGER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ledger-subType">Sub type</Label>
              <Input
                id="edit-ledger-subType"
                placeholder="e.g. Current Asset"
                value={editForm.subType}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, subType: e.target.value }))
                }
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                required
                disabled={ledgerToEdit?.isSystemLedger ?? false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ledger-category">Category</Label>
              <Input
                id="edit-ledger-category"
                placeholder="e.g. Cash"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                required
                disabled={ledgerToEdit?.isSystemLedger ?? false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ledger-openingBalance">
                Opening balance (optional)
              </Label>
              <Input
                id="edit-ledger-openingBalance"
                type="number"
                step="any"
                placeholder="0"
                value={editForm.openingBalance ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm((prev) => ({
                    ...prev,
                    openingBalance:
                      v === ''
                        ? undefined
                        : (() => {
                            const n = parseFloat(v);
                            return Number.isNaN(n) ? undefined : n;
                          })(),
                  }));
                }}
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => {
                  setEditDialogOpen(false);
                  setLedgerToEdit(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="font-custom focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                disabled={updateLedger.isPending}
              >
                {updateLedger.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <DataTable columns={columns} data={filteredLedgers} />
    </div>
  );
});

export default LedgerTab;
