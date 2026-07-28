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

Then run the migration in `supabase/migrations/0001_profiles.sql` against
your project (Supabase dashboard > SQL Editor, paste and run). It creates
the `profiles` table, row-level security policies, and a trigger that
creates a profile row on sign up.

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
supabase/migrations/           # SQL to run against your Supabase project
```
