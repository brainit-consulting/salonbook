# Pepper Tree Hair

A booking site for one made-up hair salon in Beacon, New York, built as a workshop demo. A client picks a service, a stylist and a time, and gets a confirmation email with a private link to cancel. The owner signs in to a diary of the day's bookings, sets up services, stylists, weekly hours and time off, and can connect an AI assistant such as Claude Code, which then works in the salon as the owner: it reads the diary and makes or cancels bookings, and every call it makes is logged. All times are US Eastern and all prices are US dollars. Nothing here is a real business, so do not put real client details into it.

## Run it

You need Docker Desktop running, Node and pnpm.

1. `pnpm install`
2. Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` to a long random string. `openssl rand -base64 32` makes one.
3. `pnpm db:up` starts Postgres in Docker. It listens on host port 5434, not the usual 5432, so it stays clear of any other Postgres on the machine.
4. `pnpm db:migrate` creates the tables, including the rule that stops two bookings overlapping for one stylist.
5. `pnpm demo:seed` lays down sample services, stylists, hours, two days of time off and 14 bookings running from yesterday through the next six days.
6. `pnpm dev`
7. Open http://localhost:3000.
8. Go to "Owner sign in" and sign up once. The first account becomes the owner, and sign-up closes after that.

The sample bookings are dated from the day the seed runs. When the diary starts to look old, run `pnpm demo:seed` again. It clears services, stylists, hours, time off and bookings and lays them down fresh. It does not touch the owner's account, connected assistants or the logs.

## What each .env entry is for

| Entry | What it does |
| --- | --- |
| `POSTGRES_URL` | Where the database is. The value in `.env.example` matches the Docker database on port 5434. |
| `BETTER_AUTH_SECRET` | Signs the owner's sign-in cookie. Required. Any long random string. |
| `BETTER_AUTH_URL` | The address the site is served from. Sign-in and the AI assistant connection both build their links from it. `http://localhost:3000` for local work. |
| `RESEND_API_KEY` | Leave empty and no email is sent: each one is written, saved and shown on the owner's system page. Set a Resend key and they are delivered. |
| `EMAIL_FROM` | The sender on booking emails. With a Resend key this must be an address on a domain you have verified with Resend. |
| `OWNER_NOTIFY_EMAIL` | Where the owner is told about new and cancelled bookings. Leave empty to use the owner account's own email address. |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Runs the site on http://localhost:3000. |
| `pnpm build` | Runs the database migrations, then builds for production. |
| `pnpm start` | Serves the production build. |
| `pnpm lint` | Runs ESLint. |
| `pnpm db:up` | Starts the Postgres container. |
| `pnpm db:down` | Stops it. The data is kept. |
| `pnpm db:generate` | Writes a new migration after a change to `src/lib/db/schema.ts`. |
| `pnpm db:migrate` | Applies migrations to the database. |
| `pnpm db:studio` | Opens Drizzle Studio to look at the tables. |
| `pnpm email:dev` | Previews the booking emails on http://localhost:3001. |
| `pnpm demo:seed` | Clears and re-lays the sample salon data. Safe to run as often as you like. |

## Connect Claude Code

With the site running and an owner account made:

```
claude mcp add --transport http pepper-tree http://localhost:3000/mcp
```

Then start Claude Code and type `/mcp`. Pick `pepper-tree` and sign in. A browser window opens, you sign in as the owner, and a consent screen asks whether to let Claude Code in. After you approve, ask it something like "who is in tomorrow morning" or "book Walt Brennan a men's cut with Tomasz on Friday".

The assistant acts as the owner. Everything it does, reads included, shows up in the call log on the owner's system page, and the owner can cut it off in settings.

## Where things are

- `DESIGN.md` has the visual rules every page follows.
- `src/lib/salon` holds the salon's rules: services and stylists, free times, making and cancelling a booking. Pages and the assistant's tools both go through it.
- `src/lib/db/schema.ts` is the tables. `drizzle/` is the migrations.
- `src/app/(legal)/privacy` is the privacy page. `src/lib/legal.ts` holds the contact address it needs, which is unset until you fill it in. The page shows a yellow marker until then.

## Not built yet

- Reminders before an appointment
- Payments or deposits
- SMS
- Several services in one visit
- Stylists signing in to see their own day
- Client history
- Repeat bookings
- Moving a booking to another time (cancel and rebook instead)
- Photos
