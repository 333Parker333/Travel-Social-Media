import { supabase } from './supabase';
import type { IngestedBooking } from '../types/trip';

export async function uploadBookingPhoto(params: {
  userId: string;
  tripId: string;
  fileUri: string;
  mimeType: string;
}): Promise<IngestedBooking> {
  const { userId, tripId, fileUri, mimeType } = params;

  const extension = mimeType.split('/')[1] ?? 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('booking-uploads')
    .upload(path, arrayBuffer, { contentType: mimeType });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: booking, error: insertError } = await supabase
    .from('ingested_bookings')
    .insert({ user_id: userId, trip_id: tripId, file_path: path, status: 'processing' })
    .select()
    .single();

  if (insertError || !booking) {
    throw new Error(insertError?.message ?? 'Could not create booking record.');
  }

  const { data: fnData, error: fnError } = await supabase.functions.invoke('extract-booking', {
    body: { bookingId: booking.id },
  });

  if (fnError) {
    throw new Error(fnError.message);
  }
  if (fnData?.error) {
    throw new Error(fnData.error);
  }

  return fnData.booking as IngestedBooking;
}

export async function markBookingApplied(bookingId: string, legId: string): Promise<void> {
  const { error } = await supabase
    .from('ingested_bookings')
    .update({ status: 'applied', leg_id: legId })
    .eq('id', bookingId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function dismissBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.from('ingested_bookings').update({ status: 'dismissed' }).eq('id', bookingId);
  if (error) {
    throw new Error(error.message);
  }
}
