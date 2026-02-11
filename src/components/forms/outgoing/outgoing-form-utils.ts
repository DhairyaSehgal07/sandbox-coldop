import type {
  IncomingGatePassItem,
  IncomingGatePassBagSizeLocation,
} from '@/services/incoming-gate-pass/useGetIncomingGatePassesOfSingleFarmer';

export interface IncomingGatePassDisplayGroup {
  groupKey: string;
  groupLabel: string;
  passes: IncomingGatePassItem[];
}

export interface LocationFilters {
  chamber: string;
  floor: string;
  row: string;
}

/** Format an ISO date string for display (e.g. "2026-02-11T00:00:00.000Z" → "11 Feb 2026"). */
export function formatGroupDate(isoDate: string): string {
  if (!isoDate?.trim()) return 'No date';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
      groupLabel: formatGroupDate(date),
      passes: sorted,
    };
  });
}

/** Get bag size detail for a given size name, or null if not present. */
export function getBagDetailForSize(
  pass: IncomingGatePassItem,
  sizeName: string
): {
  initialQuantity: number;
  currentQuantity: number;
  location?: IncomingGatePassBagSizeLocation;
} | null {
  const bag = pass.bagSizes?.find((b) => b?.name?.trim() === sizeName.trim());
  if (!bag) return null;
  return {
    initialQuantity: bag.initialQuantity,
    currentQuantity: bag.currentQuantity,
    location: bag.location,
  };
}

/** Collect unique chamber, floor, row values from all bag sizes across passes. */
export function getUniqueLocationValues(passes: IncomingGatePassItem[]): {
  chambers: string[];
  floors: string[];
  rows: string[];
} {
  const chambers = new Set<string>();
  const floors = new Set<string>();
  const rows = new Set<string>();
  for (const p of passes) {
    for (const bag of p.bagSizes ?? []) {
      const loc = bag?.location;
      if (loc?.chamber?.trim()) chambers.add(loc.chamber.trim());
      if (loc?.floor?.trim()) floors.add(loc.floor.trim());
      if (loc?.row?.trim()) rows.add(loc.row.trim());
    }
  }
  return {
    chambers: [...chambers].sort(),
    floors: [...floors].sort(),
    rows: [...rows].sort(),
  };
}

/** True if pass has at least one bag matching all non-empty location filters. */
export function passMatchesLocationFilters(
  pass: IncomingGatePassItem,
  filters: LocationFilters
): boolean {
  const hasChamber = filters.chamber.trim() !== '';
  const hasFloor = filters.floor.trim() !== '';
  const hasRow = filters.row.trim() !== '';
  if (!hasChamber && !hasFloor && !hasRow) return true;

  for (const bag of pass.bagSizes ?? []) {
    const loc = bag?.location;
    if (!loc) continue;
    if (hasChamber && (loc.chamber ?? '').trim() !== filters.chamber.trim())
      continue;
    if (hasFloor && (loc.floor ?? '').trim() !== filters.floor.trim()) continue;
    if (hasRow && (loc.row ?? '').trim() !== filters.row.trim()) continue;
    return true;
  }
  return false;
}
