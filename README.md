<p align="center">
  <img src="public/hero2.png" alt="FocusJourney: turn a focus session into a journey from Delhi to Jaipur" width="100%" />
</p>

<h4 align="center">
  <a href="https://github.com/kaihere14/focus-journey">Repository</a> |
  <a href="docs/about.md">Product Doc</a>
</h4>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript 5" /></a>
</p>

FocusJourney is a focus/productivity app that treats a work session as a journey rather than a
timer. Instead of counting down minutes, it moves you from a starting location to a destination
along a virtual road, with checkpoints, an ETA, and an arrival.

A typical focus app says:

`45 minutes remaining`

FocusJourney says:

`32 km until arrival`

The timer still drives the session underneath. The experience on top is movement.

## Why this exists

Most focus apps reduce productivity to a countdown. FocusJourney uses a travel metaphor instead,
so a session has a sense of progress, checkpoints, and arrival, closer to a flight tracker than a
Pomodoro clock.

## How it works

1. Your current location is detected and stored.
2. You pick a destination and start the journey.
3. The session timer runs underneath while progress along the route, checkpoints, and ETA update.
4. On completion, a `TravelHistory` record is created and your current location becomes the
   destination you just arrived at.
5. Your next journey starts from wherever the last one ended.

Example:

```
Journey 1: Delhi   -> Jaipur   (current location becomes Jaipur)
Journey 2: Jaipur  -> Ajmer    (current location becomes Ajmer)
```

## Data model

The data model is intentionally small: two models only.

**User** — the user's current state: `id`, `name`, `email`, `currentLatitude`,
`currentLongitude`, `currentLocationName`, `createdAt`.

**TravelHistory** — a record of a completed journey: `id`, `userId`, `fromLatitude`,
`fromLongitude`, `fromLocationName`, `toLatitude`, `toLongitude`, `toLocationName`, `startedAt`,
`completedAt`, `duration`.

`User 1 → N TravelHistory`

No separate location, route, or checkpoint models. The first version stays focused on the
journey experience, not a transportation or navigation platform.

## Getting started

You need [Bun](https://bun.sh) and a PostgreSQL database.

```bash
git clone https://github.com/kaihere14/focus-journey.git
cd focus-journey
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need environment variables for Clerk auth and your Postgres connection string — see
`.env.example` if present, or the `datasource db` block in `prisma/schema.prisma` and the
`@clerk/nextjs` setup for what's required.

## Scripts

```bash
bun run dev          # start the dev server
bun run build        # production build
bun run start        # run the production build
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run test         # jest
bun run format       # prettier --write
```

## Built with

[Next.js](https://nextjs.org) (App Router), [React](https://react.dev), TypeScript, and
Tailwind CSS for the app itself; [Clerk](https://clerk.com) for authentication;
[Prisma](https://www.prisma.io) with PostgreSQL for persistence; [Zustand](https://zustand-demo.pmnd.rs)
for client state; [Mapbox GL](https://www.mapbox.com) for the route/map rendering; and
[Framer Motion](https://www.framer.com/motion) for the journey animation.

## Product direction

FocusJourney is scoped deliberately small for its first version: no separate checkpoint or
focus-session database models unless required, no analytics infrastructure, no transportation or
driver functionality. See [`docs/about.md`](docs/about.md) for the full product context, open
product questions, and scope principles that guide future changes.
