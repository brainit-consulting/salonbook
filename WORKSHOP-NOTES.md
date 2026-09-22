# Workshop notes: Pepper Tree Hair

Written 2026-09-21, the night the app was built. Read this first on the day.

## What exists and where

| Thing | Where |
| --- | --- |
| The app, source of truth | `H:\salonbook`, pushed to https://github.com/brainit-consulting/salonbook (public) |
| Fallback copy, already set up | `H:\salonbook-demo`. Same database as the original, so your owner account is already there |
| Step-by-step for a fresh machine | `QUICKSTART.md` in the repo |
| Design rules the app follows | `DESIGN.md` in the repo |
| The `start-an-app` skill (fixed and tested today) | https://github.com/brainit-consulting/skills, `H:\skills`, and installed at `C:\Users\snake\.claude\skills\start-an-app`. All three identical |
| Fallback skill for this machine only | `C:\Users\snake\.claude\skills\salon-quickstart`. Say "salon quickstart" to Claude Code |

## The morning of the workshop, in order

1. Start Docker Desktop. Wait for it to settle. Do not touch `astra-pg-local`.
2. In `H:\salonbook`: `pnpm db:up`, then `pnpm demo:seed` so the diary dates are fresh.
3. `pnpm dev`, open http://localhost:3000.
4. Sign in at http://localhost:3000/sign-in with the owner account you made tonight (dutoit.emile@gmail.com). Sign-up is closed; there is only one owner.
5. Open Settings, then System, on the projector. Turn on "Large type".

## The demo, in order

1. **Client view.** Phone-width browser on http://localhost:3000. Pick a service, a stylist, a time, book it. The confirmation page has the private cancel link.
2. **Owner view.** Diary, then Settings, System. Show the email that was "written" (nothing is sent) and the activity log.
3. **Claude over MCP.** In a terminal: `claude mcp add --transport http pepper-tree http://localhost:3000/mcp` (already added on this machine; if so just run `/mcp` inside Claude Code, pick `pepper-tree`, sign in, click Allow).
   Ask, with the System page visible:
   - "Who's in the salon tomorrow?"
   - "Find a free time for a men's cut on Friday and book it for Dana Whitfield, 845-555-0163, dana@example.com."
   - "Cancel that booking."
   Each question shows up as a row in the agent call log: tool, arguments, rows back, milliseconds. That is the agentic loop on screen.
4. **Cut it off.** Settings, Connected apps, Revoke. The next thing Claude tries is refused and it is sent back to sign in.

## If there is no time to build live

Say "salon quickstart" to Claude Code, or follow `QUICKSTART.md`. `H:\salonbook-demo` is already a working copy.

## Things I still have not seen with my own eyes (Claude built them, tested by command, not by clicking)

- The Revoke button. The mechanism was proven with a signed token (permission removed, same token, 401). The button calling it was not clicked.
- Every owner screen signed in: diary layout, add a phone booking, services, stylists, hours, days off, settings pages.
- Dark mode and phone width past the front page.
- A saved permission called "Connection check (run by Claude Code)" is in Connected apps from tonight's test. Revoke it, or use it as the live revoke demo.

## Publishing to salondemo.vercel.app later

No code changes. On Vercel set: `POSTGRES_URL` (a hosted Postgres, Neon free tier works), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://salondemo.vercel.app`. Then sign up on the live site yourself immediately, before sharing the address: the first account becomes the owner. Claude.ai then connects to `https://salondemo.vercel.app/mcp`.

## Facts worth knowing

- Money is US dollars, times are US Eastern, set in `src/lib/salon/config.ts`.
- Two bookings can never overlap for one stylist: the database refuses the second.
- Clients can cancel online until 24 hours before; inside that the page says to phone.
- The site tells search engines to stay out (`src/app/layout.tsx` robots and `src/app/robots.ts`). Change both if it ever goes public for real.
- Your email is public in the repo, in `src/lib/legal.ts` and on the privacy page. One line to change.
- The database runs on host port 5434. Never run `docker system prune` or any all-container command on this machine.
- Not built on purpose: reminders, payments, SMS, several services per visit, stylists signing in, client history, repeat bookings, moving a booking, photos.

## What the skill work was about (for your own memory)

Your `start-an-app` skill and the copy in the public repo had drifted apart. Today they were merged, tested by building a different app with the merged skill plus three paper walk-throughs, and fixed (skills PRs #1, #2, #3). Four capabilities are marked inside the guides as "not yet built with this skill": invitations with roles, private file serving, paid plans, scheduled jobs. Expect rough edges the first time an app needs one.
