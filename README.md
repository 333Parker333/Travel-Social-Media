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
legs (flight/train/bus/stay/activity) with type-specific fields, cost, and
traveler tagging. Dates and times use the native date/time picker
(`@react-native-community/datetimepicker`, included in Expo Go — no
development build needed).

From a trip's detail screen, tap "View Trip Deck" for the swipeable deck:
Cover (title/dates/cost/travelers), Route (stepper of stops derived from
leg origins/destinations — no map yet, see below), Itinerary (day-by-day
by default, toggle to group by leg type), Cost summary (breakdown by leg
type), and Master schedule (dense table of every leg). The route card is
a simplified list rather than a real map for now — swapping in
`react-native-maps` is a natural follow-up once a Google Maps API key is
available for Android.

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
src/lib/supabase.ts                  # Supabase client
src/lib/auth-context.tsx             # session state + signUp/signIn/signOut
src/lib/trips-api.ts                 # Supabase query helpers for trips/travelers/legs
src/lib/trip-deck.ts                 # grouping/formatting helpers for the deck cards
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
