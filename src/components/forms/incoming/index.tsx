import { memo, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/forms/date-picker';
import {
  SearchSelector,
  type Option,
} from '@/components/forms/search-selector';
import { AddFarmerModal } from '@/components/forms/add-farmer-modal';
import { useGetAllFarmers } from '@/services/store-admin/functions/useGetAllFarmers';
import { useCreateIncomingGatePass } from '@/services/incoming-gate-pass/useCreateIncomingGatePass';

/** Size labels for quantity entry (matches Enter Quantities layout) */
const QUANTITY_SIZES = [
  'Ration',
  'Seed',
  'Goli',
  '12 Number',
  'Cut Tok',
  'Sugarfreeration',
] as const;

const DEFAULT_LOCATION = { chamber: '', floor: '', row: '' };

type LocationEntry = { chamber: string; floor: string; row: string };

type FieldErrors = Array<{ message?: string } | undefined>;

export const IncomingForm = memo(function IncomingForm() {
  const {
    data: farmerLinks,
    isLoading: isLoadingFarmers,
    refetch: refetchFarmers,
  } = useGetAllFarmers();

  const createGatePass = useCreateIncomingGatePass();
  const voucherNumberDisplay = '#1234';

  // Transform farmer links to SearchSelector options (active only)
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

  /* -------------------------------------------------
     ZOD SCHEMA
  ------------------------------------------------- */

  const formSchema = useMemo(
    () =>
      z.object({
        farmerStorageLinkId: z.string().min(1, 'Please select a farmer'),
        date: z.string().min(1, 'Date is required'),
        variety: z.string().min(1, 'Please select a variety'),
        truckNumber: z
          .string()
          .trim()
          .optional()
          .transform((val) => val?.toUpperCase()),
        sizeQuantities: z.record(z.string(), z.number().min(0)),
        locationBySize: z.record(
          z.string(),
          z.object({
            chamber: z.string(),
            floor: z.string(),
            row: z.string(),
          })
        ),
        remarks: z.string().max(500).default(''),
        manualGatePassNumber: z.union([z.number(), z.undefined()]),
      }),
    []
  );

  /* -------------------------------------------------
     FORM
  ------------------------------------------------- */

  const defaultSizeQuantities = useMemo(
    () =>
      Object.fromEntries(QUANTITY_SIZES.map((size) => [size, 0])) as Record<
        string,
        number
      >,
    []
  );

  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm({
    defaultValues: {
      farmerStorageLinkId: '',
      date: new Date().toISOString().slice(0, 10),
      variety: '',
      truckNumber: '',
      sizeQuantities: defaultSizeQuantities,
      locationBySize: {} as Record<string, LocationEntry>,
      remarks: '',
      manualGatePassNumber: undefined as number | undefined,
    },
    validators: {
      onSubmit: formSchema as never,
    },
    onSubmit: async ({ value, formApi }) => {
      const fallbackLocation = { chamber: 'A', floor: '1', row: 'R1' };
      const getLocation = (size: string) => {
        const loc = value.locationBySize[size];
        if (
          !loc ||
          !loc.chamber?.trim() ||
          !loc.floor?.trim() ||
          !loc.row?.trim()
        )
          return fallbackLocation;
        return {
          chamber: loc.chamber.trim(),
          floor: loc.floor.trim(),
          row: loc.row.trim(),
        };
      };
      const bagSizes = QUANTITY_SIZES.filter(
        (size) => (value.sizeQuantities[size] ?? 0) > 0
      ).map((size) => {
        const qty = value.sizeQuantities[size] ?? 0;
        const location = getLocation(size);
        return {
          name: size,
          initialQuantity: qty,
          currentQuantity: qty,
          location,
          paltaiLocation: location,
        };
      });
      if (bagSizes.length === 0) {
        bagSizes.push({
          name: QUANTITY_SIZES[0],
          initialQuantity: 0,
          currentQuantity: 0,
          location: fallbackLocation,
          paltaiLocation: fallbackLocation,
        });
      }
      await createGatePass.mutateAsync({
        farmerStorageLinkId: value.farmerStorageLinkId,
        date: value.date,
        type: 'RECEIPT',
        variety: value.variety,
        truckNumber: value.truckNumber,
        bagSizes,
        remarks: value.remarks ?? '',
      });
      formApi.reset();
      setStep(1);
    },
  });

  /* -------------------------------------------------
     UI
  ------------------------------------------------- */

  return (
    <main className="font-custom mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <h1 className="font-custom text-foreground text-3xl font-bold sm:text-4xl">
          Create Incoming Order
        </h1>

        <div className="bg-primary/20 inline-block rounded-full px-4 py-1.5">
          <span className="font-custom text-primary text-sm font-medium">
            VOUCHER NO: {voucherNumberDisplay}
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (step === 2) form.handleSubmit();
          else setStep(2);
        }}
        className="space-y-6"
      >
        <FieldGroup className="space-y-6">
          {/* Step 1: Farmer, Date, Variety, Truck, Quantities */}
          {step === 1 && (
            <>
              {/* 1. Farmer Selection */}
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
                            htmlFor="farmer-select"
                            className="font-custom mb-2 block text-base font-semibold"
                          >
                            Enter Account Name (search and select)
                          </FieldLabel>
                          <SearchSelector
                            id="farmer-select"
                            options={farmerOptions}
                            placeholder="Search or Create Farmer"
                            searchPlaceholder="Search by name, account number, or mobile..."
                            onSelect={handleFarmerSelect}
                            value={field.state.value}
                            loading={isLoadingFarmers}
                            loadingMessage="Loading farmers..."
                            emptyMessage="No farmers found"
                            className="w-full"
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
                          errors={
                            field.state.meta.errors as Array<
                              { message?: string } | undefined
                            >
                          }
                        />
                      )}
                    </Field>
                  );
                }}
              />

              {/* 2. Date */}
              <form.Field
                name="date"
                children={(field) => (
                  <Field>
                    <DatePicker
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                      label="Date"
                    />
                  </Field>
                )}
              />

              {/* 3. Variety */}
              <form.Field
                name="variety"
                children={(field) => (
                  <Field>
                    <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                      Select Variety
                    </FieldLabel>
                    <SearchSelector
                      options={[
                        { value: 'a', label: 'A' },
                        { value: 'b', label: 'B' },
                      ]}
                      onSelect={(v) => field.handleChange(v)}
                      value={field.state.value}
                    />
                  </Field>
                )}
              />

              {/* 4. Truck Number */}
              <form.Field
                name="truckNumber"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel className="font-custom mb-2 block text-base font-semibold">
                        Truck Number
                      </FieldLabel>
                      <Input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors as FieldErrors}
                        />
                      )}
                    </Field>
                  );
                }}
              />

              {/* 5. Enter Quantities (size list + inputs + total) */}
              <form.Field
                name="sizeQuantities"
                children={(field) => (
                  <form.Subscribe selector={(state) => state.values.variety}>
                    {(variety) => {
                      const sizeQuantities = field.state.value;
                      const totalQty = QUANTITY_SIZES.reduce(
                        (sum, size) => sum + (sizeQuantities[size] ?? 0),
                        0
                      );
                      const quantitiesDisabled = !variety?.trim();

                      return (
                        <Card className="overflow-hidden">
                          <CardHeader className="space-y-1.5 pb-4">
                            <CardTitle className="font-custom text-foreground text-xl font-semibold">
                              Enter Quantities
                            </CardTitle>
                            <CardDescription className="font-custom text-muted-foreground text-sm">
                              {quantitiesDisabled
                                ? 'Please select a variety first to enter quantities.'
                                : 'Enter quantity for each size.'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {QUANTITY_SIZES.map((size) => {
                              const value = sizeQuantities[size] ?? 0;
                              const displayValue =
                                value === 0 ? '' : String(value);
                              return (
                                <div
                                  key={size}
                                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <label
                                    htmlFor={`qty-${size}`}
                                    className="font-custom text-foreground text-base font-normal"
                                  >
                                    {size}
                                  </label>
                                  <Input
                                    id={`qty-${size}`}
                                    type="number"
                                    min={0}
                                    placeholder="-"
                                    disabled={quantitiesDisabled}
                                    value={displayValue}
                                    onChange={(e) => {
                                      const next = { ...field.state.value };
                                      const raw = e.target.value;
                                      const num =
                                        raw === ''
                                          ? 0
                                          : Math.max(0, parseInt(raw, 10) || 0);
                                      field.handleChange({
                                        ...next,
                                        [size]: num,
                                      });
                                    }}
                                    className="w-full sm:w-28 sm:text-right [&]:[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                </div>
                              );
                            })}
                            <Separator className="my-4" />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-custom text-foreground text-base font-normal">
                                Total / Lot No.
                              </span>
                              <span className="font-custom text-foreground text-base font-medium sm:text-right">
                                {totalQty}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }}
                  </form.Subscribe>
                )}
              />
            </>
          )}

          {/* Step 2: Enter Address (CH R FL) + Remarks */}
          {step === 2 && (
            <>
              <form.Field
                name="locationBySize"
                children={(field) => (
                  <form.Subscribe
                    selector={(state) => state.values.sizeQuantities}
                  >
                    {(sizeQuantities) => {
                      const sizesWithQty = QUANTITY_SIZES.filter(
                        (size) => (sizeQuantities[size] ?? 0) > 0
                      );
                      const locationBySize = field.state.value ?? {};

                      const clearAllLocations = () => {
                        const next: Record<string, LocationEntry> = {};
                        for (const size of sizesWithQty) {
                          next[size] = { ...DEFAULT_LOCATION };
                        }
                        field.handleChange(next);
                      };

                      const getLocation = (size: string) =>
                        locationBySize[size] ?? { ...DEFAULT_LOCATION };

                      const setLocation = (
                        size: string,
                        key: keyof LocationEntry,
                        value: string
                      ) => {
                        const prev = getLocation(size);
                        field.handleChange({
                          ...locationBySize,
                          [size]: { ...prev, [key]: value },
                        });
                      };

                      return (
                        <Card className="overflow-hidden">
                          <CardHeader className="space-y-1.5 pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-1.5">
                                <CardTitle className="font-custom text-foreground text-xl font-semibold">
                                  Enter Address (CH R FL)
                                </CardTitle>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearAllLocations}
                                className="font-custom text-muted-foreground hover:text-foreground shrink-0"
                              >
                                Clear All
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {sizesWithQty.map((size, index) => {
                              const qty = sizeQuantities[size] ?? 0;
                              const loc = getLocation(size);
                              const allFilled =
                                Boolean(loc.chamber?.trim()) &&
                                Boolean(loc.floor?.trim()) &&
                                Boolean(loc.row?.trim());
                              const combined = allFilled
                                ? `${loc.chamber.trim()} ${loc.floor.trim()} ${loc.row.trim()}`
                                : null;
                              const anyFilled =
                                !!loc.chamber?.trim() ||
                                !!loc.floor?.trim() ||
                                !!loc.row?.trim();
                              const combinedLabel = combined
                                ? combined
                                : anyFilled
                                  ? 'Enter all fields'
                                  : '-';
                              return (
                                <div key={size}>
                                  {index > 0 && <Separator className="mb-6" />}
                                  <div className="space-y-4">
                                    <h3 className="font-custom text-foreground text-base font-semibold">
                                      {size} – {qty} bags
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                      <Field>
                                        <FieldLabel className="font-custom text-foreground mb-2 block text-base font-semibold">
                                          Chamber
                                        </FieldLabel>
                                        <Input
                                          value={loc.chamber}
                                          onChange={(e) =>
                                            setLocation(
                                              size,
                                              'chamber',
                                              e.target.value
                                            )
                                          }
                                          placeholder="e.g. A"
                                          className="font-custom"
                                        />
                                      </Field>
                                      <Field>
                                        <FieldLabel className="font-custom text-foreground mb-2 block text-base font-semibold">
                                          Floor
                                        </FieldLabel>
                                        <Input
                                          value={loc.floor}
                                          onChange={(e) =>
                                            setLocation(
                                              size,
                                              'floor',
                                              e.target.value
                                            )
                                          }
                                          placeholder="e.g. 1"
                                          className="font-custom"
                                        />
                                      </Field>
                                      <Field>
                                        <FieldLabel className="font-custom text-foreground mb-2 block text-base font-semibold">
                                          Row
                                        </FieldLabel>
                                        <Input
                                          value={loc.row}
                                          onChange={(e) =>
                                            setLocation(
                                              size,
                                              'row',
                                              e.target.value
                                            )
                                          }
                                          placeholder="e.g. R1"
                                          className="font-custom"
                                        />
                                      </Field>
                                    </div>
                                    <div className="border-border/60 bg-muted/30 flex flex-col gap-2 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                      <span className="font-custom text-muted-foreground text-base font-normal">
                                        Combined Location
                                      </span>
                                      <span
                                        className={`font-custom text-base font-medium sm:text-right ${combined ? 'text-foreground' : 'text-muted-foreground'}`}
                                      >
                                        {combinedLabel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      );
                    }}
                  </form.Subscribe>
                )}
              />
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
            </>
          )}
        </FieldGroup>

        {/* Step navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="font-custom"
              >
                Back
              </Button>
            )}
            {step === 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                className="font-custom"
              >
                Reset
              </Button>
            )}
          </div>
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="font-custom px-8 font-bold"
            disabled={step === 2 ? createGatePass.isPending : false}
          >
            {step === 1
              ? 'Next'
              : createGatePass.isPending
                ? 'Submitting…'
                : 'Submit'}
          </Button>
        </div>
      </form>
    </main>
  );
});

export default IncomingForm;
