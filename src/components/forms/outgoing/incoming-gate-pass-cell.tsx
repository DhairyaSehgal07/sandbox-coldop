import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';

export interface IncomingGatePassCellProps {
  variety: string;
  currentQuantity: number;
  initialQuantity: number;
  disabled?: boolean;
}

export const IncomingGatePassCell = memo(function IncomingGatePassCell({
  variety,
  currentQuantity,
  initialQuantity,
  disabled,
}: IncomingGatePassCellProps) {
  const percentage =
    initialQuantity > 0 ? (currentQuantity / initialQuantity) * 100 : 100;
  const borderByPercentage =
    percentage < 10
      ? 'border-destructive/50 border'
      : percentage < 100
        ? 'border-amber-500/50 border dark:border-amber-400/50'
        : '';

  return (
    <Item
      variant="outline"
      size="sm"
      className={cn(
        'bg-card/50 border-border/60 px-2 py-1.5',
        borderByPercentage,
        disabled &&
          'bg-muted/30 pointer-events-none cursor-not-allowed opacity-60'
      )}
    >
      <ItemContent className="gap-0.5">
        <ItemTitle className="font-custom text-foreground/90 truncate text-[11px] leading-tight font-medium">
          {variety}
        </ItemTitle>
        <div className="text-right">
          <p className="font-custom text-foreground text-sm leading-none font-semibold">
            {currentQuantity.toFixed(1)}
          </p>
          <p className="font-custom text-muted-foreground/70 text-[10px]">
            /{initialQuantity.toFixed(1)}
          </p>
        </div>
      </ItemContent>
    </Item>
  );
});
