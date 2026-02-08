import { memo, useMemo } from 'react';
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
import { DatePicker } from '@/components/forms/date-picker';
import {
  SearchSelector,
  type Option,
} from '@/components/forms/search-selector';
import { AddFarmerModal } from '@/components/forms/add-farmer-modal';
import { useGetAllFarmers } from '@/services/store-admin/functions/useGetAllFarmers';

type FieldErrors = Array<{ message?: string } | undefined>;

export const IncomingForm = memo(function IncomingForm() {
  const {
    data: farmerLinks,
    isLoading: isLoadingFarmers,
    refetch: refetchFarmers,
  } = useGetAllFarmers();

  const voucherNumberDisplay = '#1234';
  const gatePassNo = 1234;

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
        truckNumber: z.string().min(1, 'Truck number is required'),
        bagsReceived: z.number().min(0),
        weightSlip: z.object({
          slipNumber: z.string().default(''),
          grossWeightKg: z.number().min(0),
          tareWeightKg: z.number().min(0),
        }),
        remarks: z.string().max(500).default(''),
        manualGatePassNumber: z.union([z.number(), z.undefined()]),
      }),
    []
  );

  /* -------------------------------------------------
     FORM
  ------------------------------------------------- */

  const form = useForm({
    defaultValues: {
      farmerStorageLinkId: '',
      date: new Date().toISOString().slice(0, 10),
      variety: '',
      truckNumber: '',
      bagsReceived: 0,
      weightSlip: { slipNumber: '', grossWeightKg: 0, tareWeightKg: 0 },
      remarks: '',
      manualGatePassNumber: undefined as number | undefined,
    },
    validators: {
      // Zod inferred input types (optional with .default()) don't match form; schema is correct at runtime
      onSubmit: formSchema as never,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        gatePassNo,
      };

      console.log('FORM PAYLOAD 👉', payload);
    },
  });

  /* -------------------------------------------------
     UI
  ------------------------------------------------- */

  return (
    <main className="font-custom mx-auto max-w-2xl px-4 py-6 sm:px-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <h1 className="font-custom text-3xl font-bold text-[#333] sm:text-4xl">
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
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <FieldGroup className="space-y-6">
          {/* Truck Number */}
          <form.Field
            name="truckNumber"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Truck Number</FieldLabel>
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

          {/* Variety */}
          <form.Field
            name="variety"
            children={(field) => (
              <Field>
                <FieldLabel>Select Variety</FieldLabel>
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

          {/* Date */}
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

          {/* Bags */}
          <form.Field
            name="bagsReceived"
            children={(field) => (
              <Field>
                <FieldLabel>Bags Received</FieldLabel>
                <Input
                  type="number"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseInt(e.target.value || '0'))
                  }
                />
              </Field>
            )}
          />

          {/* Remarks */}
          <form.Field
            name="remarks"
            children={(field) => (
              <Field>
                <FieldLabel>Remarks</FieldLabel>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border-input w-full rounded-md border p-2"
                />
              </Field>
            )}
          />
        </FieldGroup>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>

          <Button
            type="submit"
            variant="default"
            size="lg"
            className="px-8 font-bold"
          >
            Submit
          </Button>
        </div>
      </form>
    </main>
  );
});

export default IncomingForm;
