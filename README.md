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
screen. Once configured, it shows email/password sign up and login, then a
profile shell with a sign-out button.

## Checks

```bash
npm run lint
npm run typecheck
```

These also run in CI on every push/PR to `main`.

## Project structure

```
App.tsx                        # entry point, auth-gated routing
src/lib/supabase.ts            # Supabase client
src/lib/auth-context.tsx       # session state + signUp/signIn/signOut
src/screens/AuthScreen.tsx     # sign up / login form
src/screens/ProfileScreen.tsx  # profile shell shown once authenticated
src/types/trip.ts              # Trip/TripLeg/TripTraveler types
supabase/migrations/           # SQL to run against your Supabase project
```
