// Deno Edge Function. Deploy with:
//   supabase functions deploy extract-booking
// and set secrets with:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// provided automatically in the Edge Function environment.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const EXTRACTION_PROMPT = `You are extracting structured trip data from a travel booking confirmation (screenshot or photo). Read the image and respond with ONLY a JSON object (no markdown, no explanation) matching this shape:

{
  "type": "flight" | "train" | "bus" | "ferry" | "stay" | "activity",
  "origin": string | null,
  "destination": string | null,
  "start_time": string | null,
  "end_time": string | null,
  "cost": number,
  "confirmation_number": string | null,
  "details": {}
}

start_time/end_time must be ISO 8601 (e.g. "2027-06-01T14:30:00") or null.
cost is the total as a plain number, 0 if not shown.
details should only include fields relevant to the type, all optional:
- flight: airline, flight_number, seat, terminal, gate
- train/bus/ferry: carrier, number, seat
- stay: address, check_in_time, check_out_time, room_type
- activity: category, address, booking_reference

Use null for anything you cannot determine. Do not guess dates/times that
aren't shown in the image - leave them null rather than inventing values.
Respond with the JSON object only.`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return json({ error: 'bookingId is required' }, 400);
    }

    // Scoped to the caller's own JWT so RLS confirms they own this row.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: booking, error: fetchError } = await userClient
      .from('ingested_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return json({ error: 'Booking not found' }, 404);
    }

    // Service-role client to read the private storage object.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: file, error: downloadError } = await adminClient.storage
      .from('booking-uploads')
      .download(booking.file_path);

    if (downloadError || !file) {
      const { data: updated } = await userClient
        .from('ingested_bookings')
        .update({ status: 'error', error_message: 'Could not read the uploaded image.' })
        .eq('id', bookingId)
        .select()
        .single();
      return json({ booking: updated });
    }

    const imageBytes = new Uint8Array(await file.arrayBuffer());
    const base64Image = encodeBase64(imageBytes);
    const mediaType = file.type || 'image/jpeg';

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';

    let extracted: unknown;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      const { data: updated } = await userClient
        .from('ingested_bookings')
        .update({
          status: 'error',
          error_message: "Couldn't read this image. Enter the leg's details manually.",
        })
        .eq('id', bookingId)
        .select()
        .single();
      return json({ booking: updated });
    }

    const { data: updated, error: updateError } = await userClient
      .from('ingested_bookings')
      .update({ status: 'ready', extracted })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return json({ error: updateError.message }, 500);
    }

    return json({ booking: updated });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
