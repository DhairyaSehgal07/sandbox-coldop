import { memo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface OutgoingSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OutgoingSummarySheet = memo(function OutgoingSummarySheet({
  open,
  onOpenChange,
}: OutgoingSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="font-custom w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-custom">Outgoing Summary</SheetTitle>
        </SheetHeader>
        <div className="font-custom mt-6 text-muted-foreground">
          Summary sheet
        </div>
      </SheetContent>
    </Sheet>
  );
});
