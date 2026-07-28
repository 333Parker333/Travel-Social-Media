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

## Running

```bash
npm start      # Metro bundler, choose platform from the menu
npm run ios    # iOS simulator (macOS only)
npm run android
npm run web
```

The home screen shows a live Supabase connection status check to confirm
your `.env` is wired up correctly.

## Checks

```bash
npm run lint
npm run typecheck
```

These also run in CI on every push/PR to `main`.

## Project structure

```
App.tsx            # entry screen
src/lib/supabase.ts # Supabase client
```
