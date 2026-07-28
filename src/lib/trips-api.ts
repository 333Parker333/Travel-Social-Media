import { supabase } from './supabase';
import type { LegType, Trip, TripLeg, TripTraveler } from '../types/trip';

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) {
    throw new Error(error.message);
  }
  return data as T;
}

export async function listTrips(ownerId: string): Promise<Trip[]> {
  const result = await supabase
    .from('trips')
    .select('*')
    .eq('owner', ownerId)
    .order('created_at', { ascending: false });
  return unwrap(result) ?? [];
}

export async function getTrip(tripId: string): Promise<Trip> {
  const result = await supabase.from('trips').select('*').eq('id', tripId).single();
  return unwrap(result);
}

export async function createTrip(input: {
  owner: string;
  title: string;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
}): Promise<Trip> {
  const result = await supabase.from('trips').insert(input).select().single();
  return unwrap(result);
}

export async function updateTrip(tripId: string, patch: Partial<Trip>): Promise<Trip> {
  const result = await supabase.from('trips').update(patch).eq('id', tripId).select().single();
  return unwrap(result);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listTravelers(tripId: string): Promise<TripTraveler[]> {
  const result = await supabase
    .from('trip_travelers')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  return unwrap(result) ?? [];
}

export async function addTraveler(tripId: string, displayName: string): Promise<TripTraveler> {
  const result = await supabase
    .from('trip_travelers')
    .insert({ trip_id: tripId, display_name: displayName })
    .select()
    .single();
  return unwrap(result);
}

export async function removeTraveler(travelerId: string): Promise<void> {
  const { error } = await supabase.from('trip_travelers').delete().eq('id', travelerId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listLegs(tripId: string): Promise<TripLeg[]> {
  const result = await supabase
    .from('trip_legs')
    .select('*')
    .eq('trip_id', tripId)
    .order('position', { ascending: true });
  return unwrap(result) ?? [];
}

export async function getLeg(legId: string): Promise<TripLeg> {
  const result = await supabase.from('trip_legs').select('*').eq('id', legId).single();
  return unwrap(result);
}

export type LegInput = {
  type: LegType;
  start_time: string | null;
  end_time: string | null;
  origin: string | null;
  destination: string | null;
  cost: number;
  confirmation_number: string | null;
  applies_to: string[];
  details: Record<string, string | undefined>;
};

export async function createLeg(tripId: string, input: LegInput): Promise<TripLeg> {
  const existing = await listLegs(tripId);
  const nextPosition = existing.length > 0 ? Math.max(...existing.map((leg) => leg.position)) + 1 : 0;

  const result = await supabase
    .from('trip_legs')
    .insert({ trip_id: tripId, position: nextPosition, ...input })
    .select()
    .single();
  return unwrap(result);
}

export async function updateLeg(legId: string, patch: Partial<LegInput>): Promise<TripLeg> {
  const result = await supabase.from('trip_legs').update(patch).eq('id', legId).select().single();
  return unwrap(result);
}

export async function deleteLeg(legId: string): Promise<void> {
  const { error } = await supabase.from('trip_legs').delete().eq('id', legId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function swapLegPositions(legA: TripLeg, legB: TripLeg): Promise<void> {
  await Promise.all([
    supabase.from('trip_legs').update({ position: legB.position }).eq('id', legA.id),
    supabase.from('trip_legs').update({ position: legA.position }).eq('id', legB.id),
  ]);
}
