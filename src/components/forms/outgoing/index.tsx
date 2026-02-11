import {
  type ComponentType,
  type ReactNode,
  memo,
  useCallback,
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
  getUniqueLocationValues,
  groupIncomingPassesByDate,
  passMatchesLocationFilters,
  type LocationFilters,
} from '@/components/forms/outgoing/outgoing-form-utils';
import { DatePicker } from '@/components/forms/date-picker';
import { formatDate } from '@/lib/helpers';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ArrowDown, ArrowUp, Columns, MapPin, RotateCcw } from 'lucide-react';

type FieldErrors = Array<{ message?: string } | undefined>;

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

/** Fetches data, filter/sort state, and renders OutgoingVouchersTable (grouped by date, R. Voucher + size cells) */
function OutgoingVouchersSection({
  farmerStorageLinkId,
  varietyFilter = '',
  onResetVariety,
}: {
  farmerStorageLinkId: string;
  varietyFilter?: string;
  onResetVariety?: () => void;
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
  /** Cell key: `${passId}-${sizeName}` -> quantity to remove */
  const [cellRemovedQuantities, setCellRemovedQuantities] = useState<
    Record<string, number>
  >({});

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

  const handleOrderToggle = useCallback((passId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(passId)) next.delete(passId);
      else next.add(passId);
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setVoucherSort('asc');
    setLocationFilters({ chamber: '', floor: '', row: '' });
    setVisibleColumns(new Set());
    setCellRemovedQuantities({});
    onResetVariety?.();
  }, [onResetVariety]);

  const handleCellQuantityChange = useCallback(
    (passId: string, sizeName: string, quantity: number) => {
      setCellRemovedQuantities((prev) => ({
        ...prev,
        [`${passId}-${sizeName}`]: quantity,
      }));
    },
    []
  );

  const handleCellQuickRemove = useCallback(
    (passId: string, sizeName: string) => {
      setCellRemovedQuantities((prev) => {
        const next = { ...prev };
        delete next[`${passId}-${sizeName}`];
        return next;
      });
    },
    []
  );

  const displayGroups = useMemo(
    () => groupIncomingPassesByDate(filteredAndSortedPasses, voucherSort),
    [filteredAndSortedPasses, voucherSort]
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

export const OutgoingForm = memo(function OutgoingForm() {
  const {
    data: farmerLinks,
    isLoading: isLoadingFarmers,
    refetch: refetchFarmers,
  } = useGetAllFarmers();

  const { data: nextVoucherNumber, isLoading: isLoadingVoucher } =
    useGetReceiptVoucherNumber('outgoing');
  const voucherNumberDisplay = isLoadingVoucher
    ? '...'
    : nextVoucherNumber != null
      ? `#${nextVoucherNumber}`
      : '—';

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
        orderDate: z.string().min(1, 'Please select a date'),
        remarks: z.string().max(500).default(''),
      }),
    []
  );

  const [summaryOpen, setSummaryOpen] = useState(false);
  const openSheetRef = useRef(false);

  const form = useForm({
    defaultValues: {
      manualParchiNumber: '',
      farmerStorageLinkId: '',
      variety: '',
      orderDate: formatDate(new Date()),
      remarks: '',
    },
    validators: {
      onSubmit: formSchema as never,
    },
    onSubmit: async () => {
      if (openSheetRef.current) {
        openSheetRef.current = false;
        setSummaryOpen(true);
      }
    },
  });

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openSheetRef.current = true;
    form.handleSubmit();
  };

  return (
    <main className="font-custom mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <h1 className="font-custom text-foreground text-3xl font-bold sm:text-4xl">
          Create Outgoing Order
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

          {/* Incoming gate pass vouchers for selected farmer */}
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
                  farmerStorageLinkId={farmerStorageLinkId ?? ''}
                  varietyFilter={variety ?? ''}
                  onResetVariety={() => form.setFieldValue('variety', '')}
                />
              </Field>
            )}
          </form.Subscribe>
        </FieldGroup>

        {/* Review button */}
        <div className="flex flex-wrap items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
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
            Review
          </Button>
        </div>
      </form>

      <OutgoingSummarySheet open={summaryOpen} onOpenChange={setSummaryOpen} />
    </main>
  );
});

export default OutgoingForm;
