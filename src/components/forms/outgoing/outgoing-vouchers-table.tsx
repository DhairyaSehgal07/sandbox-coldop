import { Fragment, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { IncomingGatePassCell } from '@/components/forms/outgoing/incoming-gate-pass-cell';
import {
  getBagDetailForSize,
  type IncomingGatePassDisplayGroup,
} from '@/components/forms/outgoing/outgoing-form-utils';

export interface OutgoingVouchersTableProps {
  displayGroups: IncomingGatePassDisplayGroup[];
  visibleSizes: string[];
  selectedOrders: Set<string>;
  onOrderToggle: (passId: string) => void;
  isLoadingPasses: boolean;
  hasGradingData: boolean;
  hasFilteredData: boolean;
  varietyFilter: string;
}

export const OutgoingVouchersTable = memo(function OutgoingVouchersTable({
  displayGroups,
  visibleSizes,
  selectedOrders,
  onOrderToggle,
  isLoadingPasses,
  hasGradingData,
  hasFilteredData,
  varietyFilter,
}: OutgoingVouchersTableProps) {
  return (
    <div className="border-border/40 rounded-md border pt-2">
      {!isLoadingPasses &&
        hasGradingData &&
        hasFilteredData &&
        visibleSizes.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-custom text-foreground/80 w-[120px] font-medium">
                    R. Voucher
                  </TableHead>
                  {visibleSizes.map((size) => (
                    <TableHead
                      key={size}
                      className="font-custom text-foreground/80 font-medium"
                    >
                      {size}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayGroups.map((group) => (
                  <Fragment key={group.groupKey}>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      <TableCell
                        colSpan={visibleSizes.length + 1}
                        className="font-custom text-primary py-2.5 font-semibold"
                      >
                        {group.groupLabel}
                      </TableCell>
                    </TableRow>
                    {group.passes.map((pass) => (
                      <TableRow
                        key={pass._id}
                        className="border-border/40 hover:bg-transparent"
                      >
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                checked={selectedOrders.has(pass._id)}
                                onCheckedChange={() => onOrderToggle(pass._id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <span className="font-custom text-foreground/90 font-medium">
                                #{pass.gatePassNo}
                              </span>
                            </div>
                            {pass.truckNumber && (
                              <span className="font-custom text-muted-foreground pl-7 text-xs">
                                {pass.truckNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {visibleSizes.map((size) => {
                          const detail = getBagDetailForSize(pass, size);
                          if (!detail) {
                            return (
                              <TableCell key={size} className="py-1">
                                <div className="bg-muted/30 border-border/40 h-[58px] w-[70px] rounded-md border" />
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={size} className="py-1">
                              <IncomingGatePassCell
                                variety={pass.variety ?? ''}
                                currentQuantity={detail.currentQuantity}
                                initialQuantity={detail.initialQuantity}
                                disabled={detail.currentQuantity <= 0}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      {!isLoadingPasses &&
        hasGradingData &&
        !hasFilteredData &&
        (varietyFilter.trim() === '' ? (
          <p className="font-custom text-muted-foreground py-4 text-center text-sm">
            Select a variety from the filter above to see vouchers.
          </p>
        ) : (
          <p className="font-custom text-muted-foreground py-4 text-center text-sm">
            No vouchers match the selected variety or no bag details.
          </p>
        ))}
      {!isLoadingPasses && !hasGradingData && (
        <p className="font-custom text-muted-foreground py-4 text-center text-sm">
          No incoming gate pass vouchers for this farmer.
        </p>
      )}
      {isLoadingPasses && (
        <p className="font-custom text-muted-foreground py-4 text-center text-sm">
          Loading...
        </p>
      )}
    </div>
  );
});
