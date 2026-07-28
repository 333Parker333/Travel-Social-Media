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
traveler tagging. Dates/times are plain text fields (`YYYY-MM-DD` /
ISO 8601) for now — native date/time pickers are a polish-step upgrade.

## Checks

```bash
npm run lint
npm run typecheck
```

These also run in CI on every push/PR to `main`.

## Project structure

```
App.tsx                              # entry point, auth-gated routing
src/lib/supabase.ts                  # Supabase client
src/lib/auth-context.tsx             # session state + signUp/signIn/signOut
src/lib/trips-api.ts                 # Supabase query helpers for trips/travelers/legs
src/screens/AuthScreen.tsx           # sign up / login form
src/screens/ProfileScreen.tsx        # header + sign out, hosts TripsNavigator
src/screens/trips/TripsNavigator.tsx # simple stack: list/trip-form/trip-detail/leg-form
src/screens/trips/TripsListScreen.tsx
src/screens/trips/TripFormScreen.tsx
src/screens/trips/TripDetailScreen.tsx
src/screens/trips/LegFormScreen.tsx
src/types/trip.ts                    # Trip/TripLeg/TripTraveler types
supabase/migrations/                 # SQL to run against your Supabase project
```
