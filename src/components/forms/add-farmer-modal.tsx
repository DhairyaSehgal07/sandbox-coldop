import { memo, useState, useMemo } from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { Info, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type FieldErrors = Array<{ message?: string } | undefined>;

/* -------------------------------------------------
   UI-ONLY MODAL
------------------------------------------------- */

export const AddFarmerModal = memo(function AddFarmerModal() {
  const [isOpen, setIsOpen] = useState(false);

  /* ----------------------------------
     ZOD SCHEMA (BASIC)
  ---------------------------------- */

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, 'Name is required'),
        address: z.string().min(1, 'Address is required'),
        mobileNumber: z.string().length(10, 'Mobile number must be 10 digits'),
        accountNumber: z.string().min(1, 'Account number is required'),
        costPerBag: z
          .string()
          .min(1, 'Cost per bag is required')
          .refine(
            (s) => !isNaN(Number(s)) && Number(s) >= 0,
            'Cost per bag cannot be negative'
          )
          .transform(Number),
        openingBalance: z
          .string()
          .refine((s) => s === '' || !isNaN(Number(s)), 'Invalid number')
          .transform((s) => (s === '' ? 0 : Number(s))),
      }),
    []
  );

  /* ----------------------------------
     FORM
  ---------------------------------- */

  const form = useForm({
    defaultValues: {
      name: '',
      address: '',
      mobileNumber: '',
      accountNumber: '',
      costPerBag: '',
      openingBalance: '',
    },

    validators: {
      onSubmit: formSchema,
    },

    onSubmit: async ({ value }) => {
      console.log('ADD FARMER PAYLOAD 👉', value);
      setIsOpen(false);
      form.reset();
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) form.reset();
  };

  /* ----------------------------------
     RENDER
  ---------------------------------- */

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-custom h-10 w-full sm:w-auto">
          <Plus className="h-4 w-4 shrink-0" />
          New Farmer
        </Button>
      </DialogTrigger>

      <DialogContent className="font-custom sm:max-w-[425px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Farmer</DialogTitle>
            <DialogDescription>
              Enter the farmer details to register them quickly
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="mt-6 grid gap-4">
            {/* ---------------- ACCOUNT NUMBER ---------------- */}

            <form.Field
              name="accountNumber"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={field.name}>
                        Account Number
                      </FieldLabel>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                          >
                            <Info className="text-muted-foreground h-4 w-4" />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent className="max-w-xs">
                          Account numbers must be unique.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
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

            {/* ---------------- MOBILE NUMBER ---------------- */}

            <form.Field
              name="mobileNumber"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Mobile Number</FieldLabel>

                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value.replace(/\D/g, '').slice(0, 10)
                        )
                      }
                      maxLength={10}
                      aria-invalid={isInvalid}
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

            {/* ---------------- NAME ---------------- */}

            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>

                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter farmer name"
                      aria-invalid={isInvalid}
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

            {/* ---------------- ADDRESS ---------------- */}

            <form.Field
              name="address"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>

                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter address"
                      aria-invalid={isInvalid}
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

            {/* ---------------- COST PER BAG ---------------- */}

            <form.Field
              name="costPerBag"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Cost per bag</FieldLabel>

                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={0}
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0"
                      aria-invalid={isInvalid}
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

            {/* ---------------- OPENING BALANCE ---------------- */}

            <form.Field
              name="openingBalance"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Opening balance
                    </FieldLabel>

                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step={0.01}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0"
                      aria-invalid={isInvalid}
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
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit">Add Farmer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
