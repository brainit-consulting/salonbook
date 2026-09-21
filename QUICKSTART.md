# Quickstart: get the finished salon running from the repo

Use this if there isn't time to build live. It takes about five minutes, most of it
waiting for the install.

## Before you start

- **Docker Desktop is running.** The salon's data lives in a Postgres database that
  runs in Docker.
- **Node 22 and pnpm** are installed. Check with `node --version` and `pnpm --version`.
- **GitHub CLI is signed in** (`gh auth status`). The repo is private.

## 1. Clone it into a new folder on H:

In PowerShell:

```powershell
cd H:\
gh repo clone brainit-consulting/salonbook salonbook-demo
cd H:\salonbook-demo
```

## 2. Install

```powershell
pnpm install
```

## 3. Create the settings file

```powershell
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Open `.env` and paste the line that command printed after `BETTER_AUTH_SECRET=`.
Leave everything else as it is. An empty `RESEND_API_KEY` is correct: the app writes
its emails down and shows them on the System page, and sends nothing.

## 4. Start the database, create the tables, load the sample salon

```powershell
pnpm db:up
pnpm db:migrate
pnpm demo:seed
```

`pnpm demo:seed` fills the salon with services, three stylists and about fourteen
bookings dated around today. Run it again on the morning of the workshop so the
diary looks current. It never touches accounts.

## 5. Run it

```powershell
pnpm dev
```

Open http://localhost:3000. That is what a client sees.

## 6. Become the owner

Go to http://localhost:3000/sign-up and create an account. The first account becomes
the owner, and sign-up closes after it.

**If it says the salon already has an owner:** you are on the machine where the app
was first built. The clone shares that database on purpose (see the note at the
bottom). Go to http://localhost:3000/sign-in and use the account you made then.

Then look at:

- **Diary**: every stylist's day side by side.
- **Settings, then System**: what is set up, the agent call log, every email the app
  wrote, and what changed. This is the screen for the projector.

## 7. Connect Claude Code

In a terminal, from any folder:

```powershell
claude mcp add --transport http pepper-tree http://localhost:3000/mcp
```

Start Claude Code, type `/mcp`, pick `pepper-tree` and sign in. Your browser opens
the salon's own sign-in page, then a consent screen. Click **Allow**.

Things to ask it, with **Settings, then System** open on the projector beside it:

- "Who's in the salon tomorrow?"
- "Find me a free time for a men's cut on Friday and book it for Dana Whitfield,
  845-555-0163, dana@example.com."
- "Cancel that booking."

Each question becomes one or more rows in the agent call log: which tool, what it
asked for, how many rows came back, how long it took. That is the agentic loop,
visible.

To cut the connection off: **Settings, then Connected apps, then Revoke**. The next
call Claude makes is refused.

## If something goes wrong

| What you see | What it means | Fix |
| --- | --- | --- |
| `pnpm db:up` says it cannot connect to the Docker API | Docker Desktop is not running | Start it, wait for the whale icon to settle, run the command again |
| `pnpm db:migrate` fails to connect | The database is still starting | Wait ten seconds and run it again |
| Port 3000 is in use | Another app is on it | Close that app. The Claude connection is tied to port 3000, so don't switch ports |
| Port 5434 is in use | Something else took the salon's database port | Change `5434` in both `docker-compose.yml` and `.env`, then `pnpm db:up` again |
| Claude signs in but every call is refused | The connection was revoked | Run `/mcp` in Claude Code and sign in again |

## Two things worth knowing

**The clone shares its database with the original folder on the same machine.**
`docker-compose.yml` names the project `salonbook`, so `H:\salonbook` and
`H:\salonbook-demo` use the same database container and the same data. That is handy
for a fallback: your owner account and bookings are already there. On a different
computer you get a fresh, empty database.

**To wipe the salon's database and start clean**, from inside the project folder:

```powershell
docker compose down -v
pnpm db:up
pnpm db:migrate
pnpm demo:seed
```

Run that only from inside the salon's folder. It removes this project's database
and nothing else. Never use Docker's "prune" or "remove all" commands to clean up:
those act on every container on the machine, including ones that belong to other
work.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the app at http://localhost:3000 |
| `pnpm db:up` / `pnpm db:down` | Starts and stops the salon's database |
| `pnpm db:migrate` | Creates or updates the tables |
| `pnpm demo:seed` | Reloads the sample salon with dates around today |
| `pnpm db:studio` | Opens a browser view of the tables |
| `pnpm email:dev` | Previews the email designs at http://localhost:3001 |
| `pnpm build` then `pnpm start` | Runs the app the way a live site would |
