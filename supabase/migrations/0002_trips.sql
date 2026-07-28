-- Run after 0001_profiles.sql. Trip data model: trips, the travelers tagged
-- on a trip, the ordered legs (flights/trains/buses/stays/activities), and
-- attachments on a leg (confirmation PDFs, screenshots, etc).

create type public.trip_status as enum ('draft', 'upcoming', 'completed', 'archived');

create type public.leg_type as enum ('flight', 'train', 'bus', 'stay', 'activity');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled trip',
  cover_photo text,
  status public.trip_status not null default 'draft',
  shared_with uuid[] not null default '{}',
  destinations text[] not null default '{}',
  start_date date,
  end_date date,
  total_cost numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_owner_idx on public.trips (owner);
create index trips_shared_with_idx on public.trips using gin (shared_with);

-- People a trip applies to. Not every traveler has an account, so user_id
-- is optional (e.g. tagging "Mom" without her being a Trip Deck user).
create table public.trip_travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create index trip_travelers_trip_id_idx on public.trip_travelers (trip_id);

create table public.trip_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  type public.leg_type not null,
  position integer not null default 0,
  start_time timestamptz,
  end_time timestamptz,
  origin text,
  destination text,
  cost numeric(12, 2) not null default 0,
  confirmation_number text,
  applies_to uuid[] not null default '{}',
  -- type-specific fields: flight number/airline/seat, stay address/check-in,
  -- activity booking ref, etc. Shape depends on `type`.
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trip_legs_trip_id_idx on public.trip_legs (trip_id, position);

create table public.leg_attachments (
  id uuid primary key default gen_random_uuid(),
  leg_id uuid not null references public.trip_legs (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  content_type text,
  created_at timestamptz not null default now()
);

create index leg_attachments_leg_id_idx on public.leg_attachments (leg_id);

-- Keep trips.total_cost in sync with the sum of its legs' costs.
create or replace function public.recalculate_trip_total_cost()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  affected_trip_id uuid := coalesce(new.trip_id, old.trip_id);
begin
  update public.trips
  set total_cost = (
    select coalesce(sum(cost), 0) from public.trip_legs where trip_id = affected_trip_id
  )
  where id = affected_trip_id;
  return null;
end;
$$;

create trigger trip_legs_recalculate_cost
  after insert or update of cost or delete on public.trip_legs
  for each row execute function public.recalculate_trip_total_cost();

-- Bump updated_at on any row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create trigger trip_legs_set_updated_at
  before update on public.trip_legs
  for each row execute function public.set_updated_at();

-- RLS: a trip is visible/editable by its owner, and visible (read-only) to
-- anyone in shared_with. Child tables inherit access via their trip.
alter table public.trips enable row level security;
alter table public.trip_travelers enable row level security;
alter table public.trip_legs enable row level security;
alter table public.leg_attachments enable row level security;

create policy "Trips are viewable by owner or shared users"
  on public.trips for select
  using (auth.uid() = owner or auth.uid() = any (shared_with));

create policy "Trips are insertable by owner"
  on public.trips for insert
  with check (auth.uid() = owner);

create policy "Trips are editable by owner"
  on public.trips for update
  using (auth.uid() = owner);

create policy "Trips are deletable by owner"
  on public.trips for delete
  using (auth.uid() = owner);

create policy "Trip travelers follow trip access"
  on public.trip_travelers for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_travelers.trip_id
        and (trips.owner = auth.uid() or auth.uid() = any (trips.shared_with))
    )
  );

create policy "Trip travelers are editable by trip owner"
  on public.trip_travelers for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_travelers.trip_id and trips.owner = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = trip_travelers.trip_id and trips.owner = auth.uid()
    )
  );

create policy "Trip legs follow trip access"
  on public.trip_legs for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_legs.trip_id
        and (trips.owner = auth.uid() or auth.uid() = any (trips.shared_with))
    )
  );

create policy "Trip legs are editable by trip owner"
  on public.trip_legs for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_legs.trip_id and trips.owner = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = trip_legs.trip_id and trips.owner = auth.uid()
    )
  );

create policy "Leg attachments follow trip access"
  on public.leg_attachments for select
  using (
    exists (
      select 1 from public.trip_legs
      join public.trips on trips.id = trip_legs.trip_id
      where trip_legs.id = leg_attachments.leg_id
        and (trips.owner = auth.uid() or auth.uid() = any (trips.shared_with))
    )
  );

create policy "Leg attachments are editable by trip owner"
  on public.leg_attachments for all
  using (
    exists (
      select 1 from public.trip_legs
      join public.trips on trips.id = trip_legs.trip_id
      where trip_legs.id = leg_attachments.leg_id and trips.owner = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trip_legs
      join public.trips on trips.id = trip_legs.trip_id
      where trip_legs.id = leg_attachments.leg_id and trips.owner = auth.uid()
    )
  );
