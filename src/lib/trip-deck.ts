import type { LegType, Trip, TripLeg, TripTraveler } from '../types/trip';

export const LEG_TYPE_LABEL: Record<LegType, string> = {
  flight: 'Flight',
  train: 'Train',
  bus: 'Bus',
  ferry: 'Ferry',
  stay: 'Stay',
  activity: 'Activity',
};

const LEG_TYPE_ORDER: LegType[] = ['flight', 'train', 'bus', 'ferry', 'stay', 'activity'];

export type DayGroup = {
  key: string;
  label: string;
  legs: TripLeg[];
};

export type TypeGroup = {
  type: LegType;
  label: string;
  legs: TripLeg[];
};

/**
 * Activity legs with no start_time are "wishlist" ideas not locked to a
 * day; everything else (including activities that do have a time) is
 * scheduled. Setting or clearing a leg's start_time moves it between the
 * two - there's no separate flag to keep in sync.
 */
export function partitionLegs(legs: TripLeg[]): { scheduled: TripLeg[]; wishlist: TripLeg[] } {
  const wishlist = legs.filter((leg) => leg.type === 'activity' && !leg.start_time);
  const scheduled = legs.filter((leg) => !(leg.type === 'activity' && !leg.start_time));
  return { scheduled, wishlist };
}

export function groupLegsByDay(legs: TripLeg[]): DayGroup[] {
  const buckets = new Map<string, TripLeg[]>();
  const unscheduled: TripLeg[] = [];

  for (const leg of legs) {
    if (!leg.start_time) {
      unscheduled.push(leg);
      continue;
    }
    const key = leg.start_time.split('T')[0];
    const bucket = buckets.get(key) ?? [];
    bucket.push(leg);
    buckets.set(key, bucket);
  }

  const groups = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayLegs]) => ({
      key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      legs: dayLegs,
    }));

  if (unscheduled.length > 0) {
    groups.push({ key: 'unscheduled', label: 'Unscheduled', legs: unscheduled });
  }

  return groups;
}

export function groupLegsByType(legs: TripLeg[]): TypeGroup[] {
  return LEG_TYPE_ORDER.filter((type) => legs.some((leg) => leg.type === type)).map((type) => ({
    type,
    label: LEG_TYPE_LABEL[type],
    legs: legs.filter((leg) => leg.type === type),
  }));
}

export function travelerName(travelers: TripTraveler[], travelerId: string): string {
  return travelers.find((t) => t.id === travelerId)?.display_name ?? 'Unknown';
}

export function formatLegTimeRange(leg: TripLeg): string {
  if (!leg.start_time) {
    return 'No time set';
  }
  const start = new Date(leg.start_time);
  const startLabel = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (!leg.end_time) {
    return startLabel;
  }
  const end = new Date(leg.end_time);
  const endLabel = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
}

export function costByType(legs: TripLeg[]): { type: LegType; label: string; cost: number }[] {
  return LEG_TYPE_ORDER.filter((type) => legs.some((leg) => leg.type === type)).map((type) => ({
    type,
    label: LEG_TYPE_LABEL[type],
    cost: legs.filter((leg) => leg.type === type).reduce((sum, leg) => sum + leg.cost, 0),
  }));
}

export function tripDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) {
    return 'Dates not set';
  }
  const format = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (startDate && endDate) {
    return `${format(startDate)} – ${format(endDate)}`;
  }
  return format(startDate ?? endDate!);
}

export function buildShareText(trip: Trip, legs: TripLeg[]): string {
  const lines = [trip.title, tripDateRange(trip.start_date, trip.end_date)];

  if (trip.destinations.length > 0) {
    lines.push(trip.destinations.join(', '));
  }

  lines.push('', `${legs.length} leg${legs.length === 1 ? '' : 's'} planned · $${trip.total_cost.toFixed(2)} total`);

  return lines.join('\n');
}
