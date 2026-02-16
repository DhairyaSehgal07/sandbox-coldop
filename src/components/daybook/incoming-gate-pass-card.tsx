import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  DaybookEntry,
  DaybookBagSize,
} from '@/services/store-admin/functions/useGetDaybook';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Printer,
  Package,
  MapPin,
  User,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DetailRow } from './detail-row';
import { openGatePassPdfInNewTab } from './gate-pass-pdf';

interface IncomingGatePassCardProps {
  entry: DaybookEntry;
}

function formatLocation(bag: DaybookBagSize): string {
  const loc = bag.location;
  if (!loc) return '—';
  return `${loc.chamber}/${loc.floor}/${loc.row}`;
}

function formatVoucherDate(date: string | undefined): string {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
}

const IncomingGatePassCard = memo(function IncomingGatePassCard({
  entry,
}: IncomingGatePassCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintPdf = async () => {
    setIsGeneratingPdf(true);
    const start = Date.now();
    try {
      await openGatePassPdfInNewTab('incoming');
      toast.success('PDF opened in new tab', {
        duration: 3000,
        description: 'Your gate pass is ready to view or print.',
      });
    } catch {
      toast.error('Could not generate PDF', {
        description: 'Please try again.',
      });
    } finally {
      const elapsed = Date.now() - start;
      const minLoaderMs = 400;
      if (elapsed < minLoaderMs) {
        setTimeout(() => setIsGeneratingPdf(false), minLoaderMs - elapsed);
      } else {
        setIsGeneratingPdf(false);
      }
    }
  };

  const farmer = entry.farmerStorageLinkId?.farmerId;
  const farmerName = farmer?.name ?? '—';
  const farmerAddress = farmer?.address ?? '—';
  const farmerMobile = farmer?.mobileNumber ?? '—';
  const accountNumber = entry.farmerStorageLinkId?.accountNumber ?? '—';

  const bagSizes = entry.bagSizes ?? [];
  const totalInitial = bagSizes.reduce((s, b) => s + b.initialQuantity, 0);
  const totalCurrent = bagSizes.reduce((s, b) => s + b.currentQuantity, 0);
  const lotNo =
    totalInitial > 0
      ? `${entry.gatePassNo}/${totalInitial}`
      : `${entry.gatePassNo}/—`;

  const variety = entry.variety ?? '—';
  const status = (entry.status ?? '—').replace(/_/g, ' ');

  return (
    <Card className="border-border/40 hover:border-primary/30 overflow-hidden pt-0 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="w-full px-4 py-4 sm:px-5 sm:py-5">
        <CardHeader className="px-0 pt-0 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                <h3 className="text-foreground font-custom text-base font-bold tracking-tight">
                  IGP{' '}
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
                {totalInitial.toLocaleString('en-IN')} bags
              </Badge>
              <Badge
                variant="outline"
                className="px-2.5 py-1 text-[10px] font-medium capitalize"
              >
                {status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <div className="mb-4 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          <DetailRow label="Farmer" value={farmerName} icon={User} />
          <DetailRow label="Account" value={`#${accountNumber}`} />
          {entry.truckNumber != null && entry.truckNumber !== '' && (
            <DetailRow label="Truck" value={entry.truckNumber} icon={Truck} />
          )}
          <DetailRow label="Variety" value={variety} icon={Package} />
          <DetailRow label="Lot No" value={lotNo} />
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

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link
                to="/store-admin/incoming/edit/$id"
                params={{ id: entry._id }}
                state={{ entry } as Record<string, unknown>}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 transition-opacity duration-200"
              aria-label={isGeneratingPdf ? 'Generating PDF…' : 'Print gate pass'}
              aria-busy={isGeneratingPdf}
              disabled={isGeneratingPdf}
              onClick={() => void handlePrintPdf()}
            >
              {isGeneratingPdf ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-primary"
                  aria-hidden
                />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            <Separator className="my-5" />
            <div className="w-full space-y-5">
              <section className="w-full">
                <h4 className="text-muted-foreground/70 mb-3 text-xs font-semibold tracking-wider uppercase">
                  Farmer Details
                </h4>
                <div className="bg-muted/30 grid w-full grid-cols-1 gap-3 rounded-lg p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailRow label="Name" value={farmerName} />
                  <DetailRow label="Mobile" value={farmerMobile} />
                  <DetailRow label="Account" value={`#${accountNumber}`} />
                  <DetailRow
                    label="Address"
                    value={farmerAddress}
                    icon={MapPin}
                  />
                </div>
              </section>

              {bagSizes.length > 0 && (
                <section className="w-full">
                  <h4 className="text-muted-foreground/70 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Stock Details
                  </h4>
                  <div className="bg-muted/30 w-full overflow-hidden rounded-lg shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60 hover:bg-muted/60 border-border/50 font-custom">
                          <TableHead className="text-foreground font-custom font-semibold">
                            Type
                          </TableHead>
                          {bagSizes.map((bag, idx) => (
                            <TableHead
                              key={idx}
                              className="text-foreground font-custom text-center font-semibold"
                            >
                              {bag.name}
                            </TableHead>
                          ))}
                          <TableHead className="text-foreground font-custom text-center font-semibold">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="font-custom">
                        <TableRow className="border-border/50 bg-background hover:bg-background">
                          <TableCell className="text-foreground font-medium">
                            Quantity
                          </TableCell>
                          {bagSizes.map((bag, idx) => (
                            <TableCell
                              key={idx}
                              className="text-foreground text-center"
                            >
                              {bag.currentQuantity}/{bag.initialQuantity}
                            </TableCell>
                          ))}
                          <TableCell className="text-primary text-center font-bold">
                            {totalCurrent}/{totalInitial}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-border/50 bg-muted/20 hover:bg-muted/20">
                          <TableCell className="text-foreground font-medium">
                            Location
                          </TableCell>
                          {bagSizes.map((bag, idx) => (
                            <TableCell
                              key={idx}
                              className="text-foreground text-center"
                            >
                              {formatLocation(bag)}
                            </TableCell>
                          ))}
                          <TableCell className="text-muted-foreground text-center">
                            —
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-border/50 bg-background hover:bg-background">
                          <TableCell className="text-foreground font-medium">
                            Marka
                          </TableCell>
                          {bagSizes.map((bag, idx) => (
                            <TableCell
                              key={idx}
                              className="text-foreground text-center"
                            >
                              {bag.initialQuantity > 0
                                ? `${entry.gatePassNo}/${bag.initialQuantity}`
                                : '—'}
                            </TableCell>
                          ))}
                          <TableCell className="text-muted-foreground text-center">
                            —
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              {entry.remarks != null && entry.remarks !== '' && (
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
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
});

export default IncomingGatePassCard;
