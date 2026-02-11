import { memo, useMemo, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Printer,
  User,
  Package,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { DetailRow } from './detail-row';
import type { DaybookEntry } from '@/services/store-admin/functions/useGetDaybook';

interface OutgoingGatePassCardProps {
  entry: DaybookEntry;
}

function formatVoucherDate(date: string | undefined): string {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
}

const OutgoingGatePassCard = memo(function OutgoingGatePassCard({
  entry,
}: OutgoingGatePassCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const farmer = entry.farmerStorageLinkId?.farmerId;
  const farmerName = farmer?.name ?? '—';
  const accountNumber = entry.farmerStorageLinkId?.accountNumber ?? '—';

  const orderDetails = useMemo(
    () => entry.orderDetails ?? [],
    [entry.orderDetails]
  );
  const { totalIssued, totalAvailable } = useMemo(() => {
    let issued = 0;
    let available = 0;
    for (const od of orderDetails) {
      issued += od.quantityIssued ?? 0;
      available += od.quantityAvailable ?? 0;
    }
    return { totalIssued: issued, totalAvailable: available };
  }, [orderDetails]);

  const bags = totalIssued + totalAvailable;

  return (
    <Card className="border-border/40 hover:border-primary/30 overflow-hidden pt-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="w-full px-4 py-4 sm:px-5 sm:py-5">
        <CardHeader className="px-0 pt-0 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                <h3 className="text-foreground font-custom text-base font-bold tracking-tight">
                  OGP{' '}
                  <span className="text-primary">
                    #{entry.gatePassNo ?? '—'}
                  </span>
                  {entry.manualParchiNumber != null && (
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      · Manual #{entry.manualParchiNumber}
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {formatVoucherDate(entry.date)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant="secondary"
                className="px-2.5 py-1 text-[10px] font-medium"
              >
                {bags.toLocaleString('en-IN')} bags
              </Badge>
            </div>
          </div>
        </CardHeader>

        <div className="mb-4 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {farmerName != null && farmerName !== '—' && (
            <DetailRow label="Farmer" value={farmerName} icon={User} />
          )}
          {accountNumber != null && (
            <DetailRow label="Account" value={`#${accountNumber}`} />
          )}
          <DetailRow
            label="Variety"
            value={entry.variety ?? '—'}
            icon={Package}
          />
          {(entry.from != null || entry.to != null) && (
            <DetailRow
              label="From → To"
              value={`${entry.from ?? '—'} → ${entry.to ?? '—'}`}
              icon={MapPin}
            />
          )}
        </div>

        <div className="border-border/50 flex w-full items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((p) => !p)}
            className="hover:bg-accent h-8 px-3 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                More
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 w-8 p-0"
            aria-label="Print gate pass"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isExpanded && (
          <>
            <Separator className="my-5" />
            <div className="w-full space-y-5">
              <section className="w-full">
                <h4 className="text-muted-foreground/70 mb-3 text-xs font-semibold tracking-wider uppercase">
                  Detailed Breakdown
                </h4>
                <div className="bg-muted/30 overflow-x-auto rounded-lg p-4">
                  <table className="font-custom w-full min-w-0 table-fixed text-sm">
                    <thead>
                      <tr className="text-muted-foreground/70 border-border/50 border-b text-left text-[10px] font-medium tracking-wider uppercase">
                        <th
                          className="w-[20%] px-1 pb-2 sm:px-1 sm:pr-3"
                          title="Bag type / size"
                        >
                          Type
                        </th>
                        <th
                          className="w-[18%] px-1 pb-2 sm:px-1 sm:pr-3"
                          title="Receipt / reference voucher"
                        >
                          Ref
                        </th>
                        <th
                          className="w-[18%] px-1 pb-2 text-right sm:px-1 sm:pr-3"
                          title="Initial quantity"
                        >
                          Init
                        </th>
                        <th
                          className="w-[22%] px-1 pb-2 text-right sm:px-1 sm:pr-3"
                          title="Quantity issued"
                        >
                          Issued
                        </th>
                        <th
                          className="w-[22%] px-1 pb-2 text-right sm:px-1 sm:pr-2"
                          title="Available"
                        >
                          Avail
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((od, idx) => {
                        const initialQty =
                          (od.quantityAvailable ?? 0) +
                          (od.quantityIssued ?? 0);
                        return (
                          <tr
                            key={`${od.size}-${idx}`}
                            className="border-border/40 border-b"
                          >
                            <td className="px-1 py-2 font-medium sm:pr-3">
                              {od.size ?? '—'}
                            </td>
                            <td className="px-1 py-2 sm:pr-3">
                              <span className="inline-flex items-center gap-1 sm:gap-1.5">
                                <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                                —
                              </span>
                            </td>
                            <td className="px-1 py-2 text-right sm:pr-3">
                              {initialQty.toLocaleString('en-IN')}
                            </td>
                            <td className="text-destructive px-1 py-2 text-right font-medium sm:pr-3">
                              {(od.quantityIssued ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="text-primary px-1 py-2 text-right font-medium sm:px-1 sm:pr-2">
                              {(od.quantityAvailable ?? 0).toLocaleString(
                                'en-IN'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {orderDetails.length > 0 && (
                        <tr className="border-border/60 bg-muted/50 text-primary border-t-2 font-semibold">
                          <td className="px-1 py-2.5 sm:pr-3" colSpan={2}>
                            Total
                          </td>
                          <td className="px-1 py-2.5 text-right sm:pr-3">
                            {(totalAvailable + totalIssued).toLocaleString(
                              'en-IN'
                            )}
                          </td>
                          <td className="text-destructive px-1 py-2.5 text-right sm:pr-3">
                            {totalIssued.toLocaleString('en-IN')}
                          </td>
                          <td className="text-primary px-1 py-2.5 text-right sm:pr-2">
                            {totalAvailable.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {entry.remarks != null && entry.remarks !== '' && (
                <>
                  <Separator />
                  <section className="w-full">
                    <h4 className="text-muted-foreground/70 mb-3 text-xs font-semibold tracking-wider uppercase">
                      Remarks
                    </h4>
                    <div className="bg-muted/30 w-full rounded-lg p-4">
                      <p className="text-foreground text-sm font-medium">
                        {entry.remarks}
                      </p>
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
});

export default OutgoingGatePassCard;
