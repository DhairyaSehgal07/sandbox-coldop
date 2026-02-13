import {
  type ComponentType,
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SearchSelector,
  type Option,
} from '@/components/forms/search-selector';
import { AddFarmerModal } from '@/components/forms/add-farmer-modal';
import { useGetAllFarmers } from '@/services/store-admin/functions/useGetAllFarmers';
import { useGetReceiptVoucherNumber } from '@/services/store-admin/functions/useGetVoucherNumber';
import { useGetIncomingGatePassesOfSingleFarmer } from '@/services/incoming-gate-pass/useGetIncomingGatePassesOfSingleFarmer';
import type { IncomingGatePassItem } from '@/services/incoming-gate-pass/useGetIncomingGatePassesOfSingleFarmer';
import { OutgoingSummarySheet } from '@/components/forms/outgoing/outgoing-summary-sheet';
import { OutgoingVouchersTable } from '@/components/forms/outgoing/outgoing-vouchers-table';
import {
  allocationKey,
  buildInitialAllocationsFromEntry,
  getBagDetailsForSize,
  getUniqueLocationValues,
  groupIncomingPassesByDate,
  parseAllocationKey,
  passMatchesLocationFilters,
  type LocationFilters,
} from '@/components/forms/outgoing/outgoing-form-utils';
import { EditOutgoingAllocations } from '@/components/forms/outgoing/edit-outgoing-allocations';
import { DatePicker } from '@/components/forms/date-picker';
import { formatDate, payloadDateSchema } from '@/lib/helpers';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ArrowDown, ArrowUp, Columns, MapPin, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateOutgoingGatePass,
  type CreateOutgoingGatePassBody,
} from '@/services/outgoing-gate-pass/useCreateOutgoingGatePass';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';

type FieldErrors = Array<{ message?: string } | undefined>;

export interface OutgoingFormProps {
  editEntry?: DaybookEntry;
  editId?: string;
}

/** Minimal form API shape for variety field + subscribe. */
interface OutgoingFormApi {
  Subscribe: ComponentType<{
    selector: (state: { values: { farmerStorageLinkId: string } }) => string;
    children: (farmerStorageLinkId: string) => ReactNode;
  }>;
  Field: ComponentType<{
    name: 'variety';
    children: (field: OutgoingVarietyFieldApi) => ReactNode;
  }>;
}

interface OutgoingVarietyFieldApi {
  state: {
    value: string;
    meta: { isTouched: boolean; isValid: boolean; errors: unknown };
  };
  handleChange: (v: string) => void;
}

/** Builds Option[] from unique variety strings (e.g. from incoming gate passes). */
function uniqueVarietyOptions(varieties: string[]): Option<string>[] {
  const unique = [...new Set(varieties)].filter(Boolean).sort();
  return unique.map((v) => ({
    value: v,
    label: v,
    searchableText: v,
  }));
}

/** Unique bag size names across all incoming gate passes */
function getUniqueSizes(passes: IncomingGatePassItem[]): string[] {
  const names = new Set<string>();
  for (const p of passes) {
    for (const bag of p.bagSizes ?? []) {
      if (bag?.name?.trim()) names.add(bag.name.trim());
    }
  }
  return [...names].sort();
}

/** Get location for display from a pass's bag at (sizeName, bagIndex). */
function getLocationForAllocation(
  pass: IncomingGatePassItem | undefined,
  sizeName: string,
  bagIndex: number
): { chamber: string; floor: string; row: string } | undefined {
  if (!pass?.bagSizes?.length) return undefined;
  const bags = pass.bagSizes.filter(
    (b) => (b?.name ?? '').trim() === sizeName.trim()
  );
  const bag = bags[bagIndex];
  if (!bag?.location) return undefined;
  const { chamber, floor, row } = bag.location;
  if (!chamber && !floor && !row) return undefined;
  return {
    chamber: chamber ?? '',
    floor: floor ?? '',
    row: row ?? '',
  };
}

/** Build API payload from form values and allocation map. Returns null if no allocations. */
function buildOutgoingPayload(
  formValues: {
    farmerStorageLinkId: string;
    variety: string;
    orderDate: string;
    remarks: string;
    from?: string;
    to?: string;
    truckNumber?: string;
  },
  gatePassNo: number,
  cellRemovedQuantities: Record<string, number>,
  incomingPasses: IncomingGatePassItem[] = []
): CreateOutgoingGatePassBody | null {
  const entries = Object.entries(cellRemovedQuantities).filter(
    ([, qty]) => qty != null && qty > 0
  );
  if (entries.length === 0) return null;

  const passById = new Map(incomingPasses.map((p) => [p._id, p]));

  const byPass = new Map<
    string,
    {
      size: string;
      quantityToAllocate: number;
      bagIndex: number;
      location?: { chamber: string; floor: string; row: string };
    }[]
  >();
  for (const [key, qty] of entries) {
    const parsed = parseAllocationKey(key);
    if (!parsed) continue;
    const { passId, sizeName, bagIndex } = parsed;
    if (!byPass.has(passId)) byPass.set(passId, []);
    const pass = passById.get(passId);
    const location = getLocationForAllocation(pass, sizeName, bagIndex);
    byPass.get(passId)!.push({
      size: sizeName,
      quantityToAllocate: qty,
      bagIndex,
      ...(location && { location }),
    });
  }

  const incomingGatePasses = [...byPass.entries()].map(
    ([incomingGatePassId, allocations]) => ({ incomingGatePassId, allocations })
  );
  if (incomingGatePasses.length === 0) return null;

  const date = payloadDateSchema.parse(formValues.orderDate);

  return {
    farmerStorageLinkId: formValues.farmerStorageLinkId,
    gatePassNo,
    date,
    variety: formValues.variety,
    ...(formValues.from?.trim() && { from: formValues.from.trim() }),
    ...(formValues.to?.trim() && { to: formValues.to.trim() }),
    ...(formValues.truckNumber?.trim() && {
      truckNumber: formValues.truckNumber.trim(),
    }),
    incomingGatePasses,
    remarks: formValues.remarks?.trim() ?? '',
  };
}

/** Fetches data, filter/sort state, and renders OutgoingVouchersTable (grouped by date, R. Voucher + size cells) */
function OutgoingVouchersSection({
  farmerStorageLinkId,
  varietyFilter = '',
  onResetVariety,
  cellRemovedQuantities,
  setCellRemovedQuantities,
}: {
  farmerStorageLinkId: string;
  varietyFilter?: string;
  onResetVariety?: () => void;
  cellRemovedQuantities: Record<string, number>;
  setCellRemovedQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}) {
  const {
    data: allPasses = [],
    isLoading,
    error,
  } = useGetIncomingGatePassesOfSingleFarmer(farmerStorageLinkId);

  const [voucherSort, setVoucherSort] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(
    () => new Set()
  );
  const [locationFilters, setLocationFilters] = useState<LocationFilters>({
    chamber: '',
    floor: '',
    row: '',
  });

  const filteredAndSortedPasses = useMemo(() => {
    let list = allPasses;
    if (varietyFilter.trim()) {
      list = list.filter((p) => p.variety?.trim() === varietyFilter);
    }
    list = list.filter((p) => passMatchesLocationFilters(p, locationFilters));
    return [...list].sort((a, b) => {
      const na = a.gatePassNo ?? 0;
      const nb = b.gatePassNo ?? 0;
      return voucherSort === 'asc' ? na - nb : nb - na;
    });
  }, [allPasses, varietyFilter, voucherSort, locationFilters]);

  const uniqueLocations = useMemo(
    () => getUniqueLocationValues(allPasses),
    [allPasses]
  );

  const tableSizes = useMemo(
    () => getUniqueSizes(filteredAndSortedPasses),
    [filteredAndSortedPasses]
  );

  /** Sizes from all passes – used for column picker when filtered result is empty so filters stay usable. */
  const allTableSizes = useMemo(() => getUniqueSizes(allPasses), [allPasses]);

  const visibleSizes = useMemo(() => {
    if (visibleColumns.size === 0 && tableSizes.length > 0) return tableSizes;
    return tableSizes.filter((s) => visibleColumns.has(s));
  }, [tableSizes, visibleColumns]);

  const handleColumnToggle = useCallback((size: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setVoucherSort('asc');
    setLocationFilters({ chamber: '', floor: '', row: '' });
    setVisibleColumns(new Set());
    setSelectedOrders(new Set());
    setCellRemovedQuantities({});
    onResetVariety?.();
  }, [onResetVariety, setCellRemovedQuantities]);

  const handleCellQuantityChange = useCallback(
    (
      passId: string,
      sizeName: string,
      quantity: number,
      bagIndex: number = 0
    ) => {
      setCellRemovedQuantities((prev) => ({
        ...prev,
        [allocationKey(passId, sizeName, bagIndex)]: quantity,
      }));
    },
    [setCellRemovedQuantities]
  );

  const handleCellQuickRemove = useCallback(
    (passId: string, sizeName: string, bagIndex: number = 0) => {
      setCellRemovedQuantities((prev) => {
        const next = { ...prev };
        delete next[allocationKey(passId, sizeName, bagIndex)];
        return next;
      });
    },
    [setCellRemovedQuantities]
  );

  const displayGroups = useMemo(
    () => groupIncomingPassesByDate(filteredAndSortedPasses, voucherSort),
    [filteredAndSortedPasses, voucherSort]
  );

  const handleOrderToggle = useCallback(
    (passId: string) => {
      const isSelecting = !selectedOrders.has(passId);
      setSelectedOrders((prev) => {
        const next = new Set(prev);
        if (isSelecting) next.add(passId);
        else next.delete(passId);
        return next;
      });
      if (isSelecting) {
        const pass = displayGroups
          .flatMap((g) => g.passes)
          .find((p) => p._id === passId);
        if (pass) {
          setCellRemovedQuantities((prev) => {
            const next = { ...prev };
            for (const size of visibleSizes) {
              const details = getBagDetailsForSize(pass, size);
              for (const detail of details) {
                if (detail.currentQuantity > 0) {
                  next[allocationKey(passId, size, detail.bagIndex)] =
                    detail.currentQuantity;
                }
              }
            }
            return next;
          });
        }
      } else {
        setCellRemovedQuantities((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            const parsed = parseAllocationKey(key);
            if (parsed?.passId === passId) delete next[key];
          }
          return next;
        });
      }
    },
    [selectedOrders, displayGroups, visibleSizes, setCellRemovedQuantities]
  );

  if (!farmerStorageLinkId) {
    return (
      <p className="font-custom text-muted-foreground text-sm">
        Select a farmer to view their incoming gate pass vouchers.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="font-custom text-muted-foreground text-sm">
        Loading vouchers...
      </p>
    );
  }

  if (error) {
    return (
      <p className="font-custom text-destructive text-sm">
        Failed to load vouchers: {error.message}
      </p>
    );
  }

  if (!allPasses.length) {
    return (
      <p className="font-custom text-muted-foreground text-sm">
        No incoming gate pass vouchers for this farmer.
      </p>
    );
  }

  const hasGradingData = allPasses.length > 0;
  const hasFilteredData =
    filteredAndSortedPasses.length > 0 && tableSizes.length > 0;
  const hasActiveFilters =
    varietyFilter.trim() !== '' ||
    locationFilters.chamber !== '' ||
    locationFilters.floor !== '' ||
    locationFilters.row !== '';

  const sizesForColumnPicker =
    tableSizes.length > 0 ? tableSizes : allTableSizes;

  return (
    <div className="space-y-3">
      {hasGradingData && (
        <div className="border-border/60 bg-muted/30 flex flex-wrap items-end gap-x-5 gap-y-4 rounded-xl border px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="font-custom text-muted-foreground text-xs leading-none font-medium">
              Sort by voucher
            </span>
            <div className="flex h-10 items-center gap-1.5">
              <Button
                type="button"
                variant={voucherSort === 'asc' ? 'default' : 'outline'}
                size="sm"
                className="font-custom h-10 gap-1.5 px-3"
                onClick={() => setVoucherSort('asc')}
              >
                <ArrowUp className="h-4 w-4" />
                Ascending
              </Button>
              <Button
                type="button"
                variant={voucherSort === 'desc' ? 'default' : 'outline'}
                size="sm"
                className="font-custom h-10 gap-1.5 px-3"
                onClick={() => setVoucherSort('desc')}
              >
                <ArrowDown className="h-4 w-4" />
                Descending
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-custom gap-2"
                >
                  <Columns className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-custom">
                  Toggle size columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sizesForColumnPicker.map((size) => (
                  <DropdownMenuCheckboxItem
                    key={size}
                    checked={visibleColumns.has(size)}
                    onCheckedChange={() => handleColumnToggle(size)}
                    className="font-custom"
                  >
                    {size}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {(uniqueLocations.chambers.length > 0 ||
            uniqueLocations.floors.length > 0 ||
            uniqueLocations.rows.length > 0) && (
            <>
              {uniqueLocations.chambers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-custom text-muted-foreground text-xs leading-none font-medium">
                    Chamber
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-custom h-10 min-w-[100px] justify-between gap-2"
                      >
                        <MapPin className="h-4 w-4 shrink-0" />
                        {locationFilters.chamber || 'All'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuRadioGroup
                        value={locationFilters.chamber}
                        onValueChange={(v) =>
                          setLocationFilters((prev) => ({
                            ...prev,
                            chamber: v ?? '',
                          }))
                        }
                      >
                        <DropdownMenuRadioItem value="" className="font-custom">
                          All
                        </DropdownMenuRadioItem>
                        {uniqueLocations.chambers.map((c) => (
                          <DropdownMenuRadioItem
                            key={c}
                            value={c}
                            className="font-custom"
                          >
                            {c}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {uniqueLocations.floors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-custom text-muted-foreground text-xs leading-none font-medium">
                    Floor
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-custom h-10 min-w-[100px] justify-between gap-2"
                      >
                        <MapPin className="h-4 w-4 shrink-0" />
                        {locationFilters.floor || 'All'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuRadioGroup
                        value={locationFilters.floor}
                        onValueChange={(v) =>
                          setLocationFilters((prev) => ({
                            ...prev,
                            floor: v ?? '',
                          }))
                        }
                      >
                        <DropdownMenuRadioItem value="" className="font-custom">
                          All
                        </DropdownMenuRadioItem>
                        {uniqueLocations.floors.map((f) => (
                          <DropdownMenuRadioItem
                            key={f}
                            value={f}
                            className="font-custom"
                          >
                            {f}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {uniqueLocations.rows.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-custom text-muted-foreground text-xs leading-none font-medium">
                    Row
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-custom h-10 min-w-[100px] justify-between gap-2"
                      >
                        <MapPin className="h-4 w-4 shrink-0" />
                        {locationFilters.row || 'All'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuRadioGroup
                        value={locationFilters.row}
                        onValueChange={(v) =>
                          setLocationFilters((prev) => ({
                            ...prev,
                            row: v ?? '',
                          }))
                        }
                      >
                        <DropdownMenuRadioItem value="" className="font-custom">
                          All
                        </DropdownMenuRadioItem>
                        {uniqueLocations.rows.map((r) => (
                          <DropdownMenuRadioItem
                            key={r}
                            value={r}
                            className="font-custom"
                          >
                            {r}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-2">
            <span className="font-custom text-muted-foreground text-xs leading-none font-medium">
              Reset
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-custom gap-2"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </div>
      )}

      <OutgoingVouchersTable
        displayGroups={displayGroups}
        visibleSizes={visibleSizes}
        selectedOrders={selectedOrders}
        onOrderToggle={handleOrderToggle}
        cellRemovedQuantities={cellRemovedQuantities}
        onCellQuantityChange={handleCellQuantityChange}
        onCellQuickRemove={handleCellQuickRemove}
        isLoadingPasses={isLoading}
        hasGradingData={hasGradingData}
        hasFilteredData={hasFilteredData}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}

/** Variety dropdown options from selected farmer's incoming gate passes (unique varieties). */
function VarietyFieldWithOptions({ form }: { form: OutgoingFormApi }) {
  return (
    <form.Subscribe
      selector={(state: { values: { farmerStorageLinkId: string } }) =>
        state.values.farmerStorageLinkId
      }
    >
      {(farmerStorageLinkId: string) => (
        <VarietyFieldInner
          form={form}
          farmerStorageLinkId={farmerStorageLinkId ?? ''}
        />
      )}
    </form.Subscribe>
  );
}

function VarietyFieldInner({
  form,
  farmerStorageLinkId,
}: {
  form: OutgoingFormApi;
  farmerStorageLinkId: string;
}) {
  const { data } = useGetIncomingGatePassesOfSingleFarmer(farmerStorageLinkId);
  const varietyOptions: Option<string>[] = useMemo(
    () =>
      data?.length ? uniqueVarietyOptions(data.map((d) => d.variety)) : [],
    [data]
  );

  return (
    <form.Field
      name="variety"
      children={(field: OutgoingVarietyFieldApi) => (
        <Field>
          <FieldLabel className="font-custom mb-2 block text-base font-semibold">
            Select Variety
          </FieldLabel>
          <SearchSelector
            options={varietyOptions}
            onSelect={(v) => field.handleChange(v)}
            value={field.state.value}
            buttonClassName="w-full justify-between"
            emptyMessage={
              farmerStorageLinkId
                ? data === undefined
                  ? 'Loading varieties...'
                  : 'No varieties in incoming vouchers'
                : 'Select a farmer first'
            }
          />
          {field.state.meta.isTouched && !field.state.meta.isValid && (
            <FieldError errors={field.state.meta.errors as FieldErrors} />
          )}
        </Field>
      )}
    />
  );
}

const defaultOutgoingFormValues = {
  manualParchiNumber: '',
  farmerStorageLinkId: '',
  variety: '',
  orderDate: formatDate(new Date()),
  from: '',
  to: '',
  truckNumber: '',
  remarks: '',
};

export const OutgoingForm = memo(function OutgoingForm({
  editEntry,
  editId,
}: OutgoingFormProps = {}) {
  const isEditMode = Boolean(editEntry);

  const {
    data: farmerLinks,
    isLoading: isLoadingFarmers,
    refetch: refetchFarmers,
  } = useGetAllFarmers();

  const { data: nextVoucherNumber, isLoading: isLoadingVoucher } =
    useGetReceiptVoucherNumber('outgoing');
  const voucherNumberDisplay = isEditMode
    ? editEntry?.gatePassNo != null
      ? `#${editEntry.gatePassNo}`
      : '—'
    : isLoadingVoucher
      ? '...'
      : nextVoucherNumber != null
        ? `#${nextVoucherNumber}`
        : '—';

  const createOutgoing = useCreateOutgoingGatePass();
  const [cellRemovedQuantities, setCellRemovedQuantities] = useState<
    Record<string, number>
  >({});
  const [pendingPayload, setPendingPayload] =
    useState<CreateOutgoingGatePassBody | null>(null);

  useEffect(() => {
    if (editEntry) {
      setCellRemovedQuantities(buildInitialAllocationsFromEntry(editEntry));
    }
  }, [editEntry]);

  const editDefaultValues = useMemo(() => {
    if (!editEntry) return null;
    const orderDate =
      editEntry.date != null && editEntry.date !== ''
        ? formatDate(new Date(editEntry.date))
        : formatDate(new Date());
    return {
      manualParchiNumber: editEntry.manualParchiNumber ?? '',
      farmerStorageLinkId: editEntry.farmerStorageLinkId?._id ?? '',
      variety: editEntry.variety ?? '',
      orderDate,
      from: editEntry.from ?? '',
      to: editEntry.to ?? '',
      truckNumber: editEntry.truckNumber ?? '',
      remarks: editEntry.remarks ?? '',
    };
  }, [editEntry]);

  const farmerOptions: Option<string>[] = useMemo(() => {
    if (!farmerLinks) return [];
    return farmerLinks
      .filter((link) => link.isActive)
      .map((link) => ({
        value: link._id,
        label: `${link.farmerId.name} (Account #${link.accountNumber})`,
        searchableText: `${link.farmerId.name} ${link.accountNumber} ${link.farmerId.mobileNumber} ${link.farmerId.address}`,
      }));
  }, [farmerLinks]);

  const handleFarmerSelect = (value: string) => {
    form.setFieldValue('farmerStorageLinkId', value);
  };

  const handleFarmerAdded = () => {
    refetchFarmers();
  };

  const formSchema = useMemo(
    () =>
      z.object({
        manualParchiNumber: z.string().trim().optional(),
        farmerStorageLinkId: z.string().min(1, 'Please select a farmer'),
        variety: z.string().min(1, 'Please select a variety'),
        orderDate: payloadDateSchema,
        from: z.string().trim().optional(),
        to: z.string().trim().optional(),
        truckNumber: z.string().trim().optional(),
        remarks: z.string().max(500).default(''),
      }),
    []
  );

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [vouchersSectionKey, setVouchersSectionKey] = useState(0);
  const openSheetRef = useRef(false);

  const form = useForm({
    defaultValues: editDefaultValues ?? defaultOutgoingFormValues,
    validators: {
      onSubmit: formSchema as never,
    },
    onSubmit: async ({ value }) => {
      if (isEditMode) {
        const payload = {
          ...(editId && { id: editId }),
          farmerStorageLinkId: value.farmerStorageLinkId,
          variety: value.variety,
          orderDate: payloadDateSchema.parse(value.orderDate),
          from: value.from?.trim() || undefined,
          to: value.to?.trim() || undefined,
          truckNumber: value.truckNumber?.trim() || undefined,
          remarks: value.remarks?.trim() ?? '',
          manualParchiNumber: value.manualParchiNumber?.trim() || undefined,
        };
        console.log('Outgoing edit payload:', payload);
        return;
      }

      if (openSheetRef.current) {
        openSheetRef.current = false;
        const gatePassNo = nextVoucherNumber ?? 1;
        const payload = buildOutgoingPayload(
          {
            farmerStorageLinkId: value.farmerStorageLinkId,
            variety: value.variety,
            orderDate: value.orderDate,
            from: value.from,
            to: value.to,
            truckNumber: value.truckNumber,
            remarks: value.remarks,
          },
          gatePassNo,
          cellRemovedQuantities,
          incomingPasses
        );
        if (!payload) {
          toast.error('Please add at least one allocation', {
            description: 'Select quantities in the vouchers table.',
          });
          return;
        }
        setPendingPayload(payload);
        setSummaryOpen(true);
      }
    },
  });

  const farmerStorageLinkIdForPasses =
    (form.state.values as { farmerStorageLinkId?: string })
      .farmerStorageLinkId ?? '';
  const { data: incomingPasses = [] } = useGetIncomingGatePassesOfSingleFarmer(
    farmerStorageLinkIdForPasses
  );

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditMode) {
      form.handleSubmit();
      return;
    }
    openSheetRef.current = true;
    form.handleSubmit();
  };

  return (
    <main className="font-custom mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <h1 className="font-custom text-foreground text-3xl font-bold sm:text-4xl">
          {isEditMode ? 'Edit Outgoing Order' : 'Create Outgoing Order'}
        </h1>

        <div className="bg-primary/20 inline-block rounded-full px-4 py-1.5">
          <span className="font-custom text-primary text-sm font-medium">
            VOUCHER NO: {voucherNumberDisplay}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleReview} className="space-y-6">
        <FieldGroup className="space-y-6">
          {/* Manual Parchi Number */}
          <form.Field
            name="manualParchiNumber"
            children={(field) => (
              <Field>
                <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                  Manual Parchi Number
                  <span className="font-custom text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. P-123"
                  className="font-custom"
                />
              </Field>
            )}
          />

          {/* Farmer Selection */}
          <form.Field
            name="farmerStorageLinkId"
            children={(field) => {
              const hasSubmitError = Boolean(
                field.state.meta.errorMap &&
                'onSubmit' in field.state.meta.errorMap &&
                field.state.meta.errorMap.onSubmit
              );
              const invalidFromValidation =
                hasSubmitError ||
                (field.state.meta.isTouched && !field.state.meta.isValid);
              const isInvalid = invalidFromValidation && !field.state.value;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <FieldLabel
                        htmlFor="outgoing-farmer-select"
                        className="font-custom mb-2 block text-base font-semibold"
                      >
                        Enter Account Name (search and select)
                      </FieldLabel>
                      <SearchSelector
                        id="outgoing-farmer-select"
                        options={farmerOptions}
                        placeholder="Search or Create Farmer"
                        searchPlaceholder="Search by name, account number, or mobile..."
                        onSelect={handleFarmerSelect}
                        value={field.state.value}
                        loading={isLoadingFarmers}
                        loadingMessage="Loading farmers..."
                        emptyMessage="No farmers found"
                        buttonClassName="w-full justify-between"
                      />
                    </div>
                    <AddFarmerModal
                      links={farmerLinks ?? []}
                      onFarmerAdded={handleFarmerAdded}
                    />
                  </div>
                  {isInvalid && (
                    <FieldError
                      errors={field.state.meta.errors as FieldErrors}
                    />
                  )}
                </Field>
              );
            }}
          />

          {/* Variety Selection (unique varieties from selected farmer's incoming gate passes) */}
          <VarietyFieldWithOptions form={form} />

          {/* Date */}
          <form.Field
            name="orderDate"
            children={(field) => (
              <Field>
                <DatePicker
                  id="outgoing-order-date"
                  label="Order Date"
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <FieldError errors={field.state.meta.errors as FieldErrors} />
                )}
              </Field>
            )}
          />

          {/* From */}
          <form.Field
            name="from"
            children={(field) => (
              <Field>
                <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                  From
                  <span className="font-custom text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Cold Storage"
                  className="font-custom"
                />
              </Field>
            )}
          />

          {/* To */}
          <form.Field
            name="to"
            children={(field) => (
              <Field>
                <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                  To
                  <span className="font-custom text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Customer"
                  className="font-custom"
                />
              </Field>
            )}
          />

          {/* Truck Number */}
          <form.Field
            name="truckNumber"
            children={(field) => (
              <Field>
                <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                  Truck Number
                  <span className="font-custom text-muted-foreground ml-1 font-normal">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. MH-12-AB-1234"
                  className="font-custom"
                />
              </Field>
            )}
          />

          {/* Remarks */}
          <form.Field
            name="remarks"
            children={(field) => (
              <Field>
                <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                  Remarks
                </FieldLabel>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border-input bg-background text-foreground font-custom placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background w-full rounded-md border p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  rows={4}
                />
              </Field>
            )}
          />

          {/* Edit mode: show issued quantities so user can update them */}
          {isEditMode && editEntry && (
            <Field>
              <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                Allocated quantities
              </FieldLabel>
              <EditOutgoingAllocations
                editEntry={editEntry}
                cellRemovedQuantities={cellRemovedQuantities}
                setCellRemovedQuantities={setCellRemovedQuantities}
              />
            </Field>
          )}

          {/* Incoming gate pass vouchers for selected farmer (create only) */}
          {!isEditMode && (
            <form.Subscribe
              selector={(state) => ({
                farmerStorageLinkId: state.values.farmerStorageLinkId,
                variety: state.values.variety,
              })}
            >
              {({ farmerStorageLinkId, variety }) => (
                <Field>
                  <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                    Incoming gate pass vouchers
                  </FieldLabel>
                  <OutgoingVouchersSection
                    key={`${farmerStorageLinkId ?? ''}-${vouchersSectionKey}`}
                    farmerStorageLinkId={farmerStorageLinkId ?? ''}
                    varietyFilter={variety ?? ''}
                    onResetVariety={() => form.setFieldValue('variety', '')}
                    cellRemovedQuantities={cellRemovedQuantities}
                    setCellRemovedQuantities={setCellRemovedQuantities}
                  />
                </Field>
              )}
            </form.Subscribe>
          )}
        </FieldGroup>

        {/* Review / Save button */}
        <div className="flex flex-wrap items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setCellRemovedQuantities({});
              setVouchersSectionKey((k) => k + 1);
            }}
            className="font-custom"
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="font-custom px-8 font-bold"
          >
            {isEditMode ? 'Save' : 'Review'}
          </Button>
        </div>
      </form>

      {!isEditMode && (
        <OutgoingSummarySheet
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
          pendingPayload={pendingPayload}
          isSubmitting={createOutgoing.isPending}
          onConfirm={() => {
            if (!pendingPayload) return;
            createOutgoing.mutate(pendingPayload, {
              onSuccess: () => {
                setSummaryOpen(false);
                setPendingPayload(null);
                form.reset();
                setCellRemovedQuantities({});
                setVouchersSectionKey((k) => k + 1);
              },
            });
          }}
        />
      )}
    </main>
  );
});

export default OutgoingForm;
