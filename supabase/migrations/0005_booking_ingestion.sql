-- Booking ingestion (photo/screenshot path): a private storage bucket for
-- uploaded confirmation images, and an ingested_bookings table tracking
-- each upload from "processing" through to a reviewed/applied leg.

insert into storage.buckets (id, name, public)
values ('booking-uploads', 'booking-uploads', false)
on conflict (id) do nothing;

-- Objects are stored at "<user_id>/<filename>"; these policies scope
-- access to the folder matching the caller's own id.
create policy "Users can upload their own booking photos"
  on storage.objects for insert
  with check (bucket_id = 'booking-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own booking photos"
  on storage.objects for select
  using (bucket_id = 'booking-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own booking photos"
  on storage.objects for delete
  using (bucket_id = 'booking-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create table public.ingested_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  leg_id uuid references public.trip_legs (id) on delete set null,
  file_path text not null,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'error', 'applied', 'dismissed')),
  extracted jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingested_bookings_user_id_idx on public.ingested_bookings (user_id);

alter table public.ingested_bookings enable row level security;

create policy "Ingested bookings are owner-only"
  on public.ingested_bookings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger ingested_bookings_set_updated_at
  before update on public.ingested_bookings
  for each row execute function public.set_updated_at();
