-- Sharing support: let a trip owner look up a friend's user id by email
-- (to add them to trips.shared_with) and then see that friend's basic
-- profile info (to display who a trip is shared with).

-- security definer bypasses the profiles RLS below so this can resolve
-- any email, but it only ever returns an id - never other profile
-- fields - and is restricted to signed-in users.
create or replace function public.find_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer set search_path = public
as $$
  select id from public.profiles where email = lookup_email limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;

-- Lets a trip owner view the profiles (email/display_name) of the people
-- they've added to that trip's shared_with, so the sharing UI can show
-- names instead of raw user ids. Combines with the existing "viewable by
-- owner" policy on profiles (permissive policies OR together).
create policy "Trip owners can view profiles of people they shared with"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trips
      where trips.owner = auth.uid() and profiles.id = any (trips.shared_with)
    )
  );
