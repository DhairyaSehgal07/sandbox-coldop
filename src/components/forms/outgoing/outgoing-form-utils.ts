import type { IncomingGatePassItem } from '@/services/incoming-gate-pass/useGetIncomingGatePassesOfSingleFarmer';

export interface IncomingGatePassDisplayGroup {
  groupKey: string;
  groupLabel: string;
  passes: IncomingGatePassItem[];
}

/** Group incoming gate passes by date; each group is sorted by gatePassNo. */
export function groupIncomingPassesByDate(
  passes: IncomingGatePassItem[],
  voucherSort: 'asc' | 'desc'
): IncomingGatePassDisplayGroup[] {
  const byDate = new Map<string, IncomingGatePassItem[]>();
  for (const p of passes) {
    const key = p.date ?? '';
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(p);
  }
  const sortedDates = [...byDate.keys()].sort();
  return sortedDates.map((date) => {
    const groupPasses = byDate.get(date)!;
    const sorted = [...groupPasses].sort((a, b) => {
      const na = a.gatePassNo ?? 0;
      const nb = b.gatePassNo ?? 0;
      return voucherSort === 'asc' ? na - nb : nb - na;
    });
    return {
      groupKey: date,
      groupLabel: date || 'No date',
      passes: sorted,
    };
  });
}

/** Get bag size detail for a given size name, or null if not present. */
export function getBagDetailForSize(
  pass: IncomingGatePassItem,
  sizeName: string
): { initialQuantity: number; currentQuantity: number } | null {
  const bag = pass.bagSizes?.find(
    (b) => b?.name?.trim() === sizeName.trim()
  );
  if (!bag) return null;
  return {
    initialQuantity: bag.initialQuantity,
    currentQuantity: bag.currentQuantity,
  };
}
