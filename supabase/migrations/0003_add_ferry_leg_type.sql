-- Adds "ferry" to the leg_type enum used by trip_legs.type.
--
-- Run this statement by itself (its own query execution), not pasted into
-- the middle of a larger script: Postgres does not allow a newly added
-- enum value to be referenced in the same transaction that added it, and
-- the Supabase SQL editor runs each "Run" as one transaction.
alter type public.leg_type add value if not exists 'ferry';
