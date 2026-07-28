# Travel Social Media

Trip logistics app: log flights, trains, stays, and activities, then generate a
swipeable "Trip Deck" to share. Built with React Native (Expo) and Supabase.

## Stack

- **App**: Expo + React Native + TypeScript
- **Backend**: Supabase (Postgres, EU region)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project's URL and anon key (Project
Settings > API in the Supabase dashboard). Use an EU-region project for
GDPR compliance.

Then run the migrations in `supabase/migrations/` against your project, in
order (Supabase dashboard > SQL Editor, paste and run each file):

- `0001_profiles.sql` — `profiles` table, RLS, and a trigger that creates a
  profile row on sign up.
- `0002_trips.sql` — trip data model: `trips`, `trip_travelers`,
  `trip_legs` (flights/trains/buses/stays/activities), `leg_attachments`,
  RLS scoped to the trip owner (plus read access for `shared_with` users),
  and a trigger that keeps `trips.total_cost` in sync with leg costs.
- `0003_add_ferry_leg_type.sql` — adds `ferry` to the `leg_type` enum.
  Run this one by itself (not pasted into a script with other
  statements) — Postgres doesn't allow a new enum value to be used in the
  same transaction that added it.
- `0004_sharing.sql` — a `find_user_id_by_email` RPC (security definer,
  execute granted to `authenticated` only) so a trip owner can resolve a
  friend's email to their user id without being able to browse the
  `profiles` table, plus an RLS policy letting a trip owner view the
  profiles of people they've shared a trip with.

## Running

```bash
npm start      # Metro bundler, choose platform from the menu
npm run ios    # iOS simulator (macOS only)
npm run android
npm run web
```

Without a configured `.env`, the app shows a "Supabase not configured"
screen. Once configured, it shows email/password sign up and login, then
your trip list. From there: create a trip, add travelers by name, and add
legs (flight/train/bus/ferry/stay/activity) with type-specific fields,
cost, and traveler tagging. Dates and times use the native date/time
picker (`@react-native-community/datetimepicker`, included in Expo Go —
no development build needed).

Activity legs have a Category field: a preset list (restaurant, hike,
museum, etc.) plus "Other" to type a custom value. Activities left
without a time appear in a separate "Things to do" section — on the
trip's detail screen and in the deck's day-by-day view — instead of being
pinned to a day. Add a time later (edit the leg) to move one into the
schedule; clear the time to send it back to the wishlist.

From a trip's detail screen, tap "View Trip Deck" for the swipeable deck:
Cover (title/dates/cost/travelers), Route (stepper of stops derived from
leg origins/destinations — no map yet, see below), Itinerary (day-by-day
by default, toggle to group by leg type), Cost summary (breakdown by leg
type), and Master schedule (dense table of every leg). The route card is
a simplified list rather than a real map for now — swapping in
`react-native-maps` is a natural follow-up once a Google Maps API key is
available for Android.

**Sharing.** The trip owner can add a friend by email from the trip's
detail screen ("Shared with" section) — they need an existing account;
long-press their chip to remove access. Shared trips show up under
"Shared with you" on the trips list for the person they were shared
with, and open read-only (no edit/reorder/delete/add controls — those
require RLS write access, which only the owner has). From the Trip Deck,
"Share" opens the native OS share sheet with a plain-text trip summary —
works for messaging apps, notes, etc.; a richer image export (for
Instagram/TikTok Stories specifically) would need `react-native-view-shot`
and is a natural follow-up.

## Checks

```bash
npm run lint
npm run typecheck
```

These also run in CI on every push/PR to `main`.

## Project structure

```
App.tsx                              # entry point, auth-gated routing
src/components/DateTimeField.tsx     # cross-platform native date/time picker field
src/components/ComboBoxField.tsx     # preset dropdown + custom text entry ("Other")
src/lib/supabase.ts                  # Supabase client
src/lib/auth-context.tsx             # session state + signUp/signIn/signOut
src/lib/trips-api.ts                 # Supabase query helpers for trips/travelers/legs
src/lib/trip-deck.ts                 # grouping/formatting/partitioning helpers for the deck cards
src/lib/activity-categories.ts       # preset activity category list
src/screens/AuthScreen.tsx           # sign up / login form
src/screens/ProfileScreen.tsx        # header + sign out, hosts TripsNavigator
src/screens/trips/TripsNavigator.tsx # simple stack: list/trip-form/trip-detail/leg-form/trip-deck
src/screens/trips/TripsListScreen.tsx
src/screens/trips/TripFormScreen.tsx
src/screens/trips/TripDetailScreen.tsx
src/screens/trips/LegFormScreen.tsx
src/screens/trips/TripDeckScreen.tsx # swipeable pager hosting the 5 deck cards
src/screens/trips/deck/CoverCard.tsx
src/screens/trips/deck/RouteCard.tsx
src/screens/trips/deck/DayByDayCard.tsx
src/screens/trips/deck/CostSummaryCard.tsx
src/screens/trips/deck/MasterScheduleCard.tsx
src/types/trip.ts                    # Trip/TripLeg/TripTraveler types
supabase/migrations/                 # SQL to run against your Supabase project
```
