# DESIGN.md — Pepper Tree Hair

Source: no reference site. Direction chosen from the brief.
Written: 2026-09-21

**Design read:** a booking site for one small neighbourhood salon, used mostly on a
phone. It should read like a well-printed price list pinned by the till: warm paper,
ink, thin rules, one peppercorn-red accent. Nothing floats, nothing glows.

**Dials:** VARIANCE 5 · MOTION 2 · DENSITY 4 (client side) / 7 (owner's diary)
The client side is three short steps, so it gets air. The diary is a working tool, so
it is dense and ruled like a ledger.

## 1. Tokens

These go into `src/app/globals.css`. No component sets a colour anywhere else.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `#F5EFE4` | `#1B1714` | page surface (paper) |
| `--foreground` | `#211C17` | `#EFE7DA` | primary text (ink) |
| `--card` / `--popover` | `#FBF7EF` | `#231E1A` | a lighter sheet laid on the paper |
| `--card-foreground` / `--popover-foreground` | `#211C17` | `#EFE7DA` | text on a sheet |
| `--muted` | `#EAE2D3` | `#2C2621` | quiet fills, taken slots |
| `--muted-foreground` | `#6B6053` | `#A89C8C` | secondary text |
| `--secondary` | `#EAE2D3` | `#2C2621` | secondary buttons |
| `--secondary-foreground` | `#211C17` | `#EFE7DA` | text on secondary |
| `--accent` | `#EAE2D3` | `#2C2621` | hover fill (shadcn's "accent" is a hover state, not the brand colour) |
| `--accent-foreground` | `#211C17` | `#EFE7DA` | text on hover fill |
| `--border` / `--input` | `#CFC4B0` | `#3D352E` | 1px rules |
| `--ring` | `#9E2F45` | `#E0788A` | focus ring |
| `--primary` | `#9E2F45` | `#E0788A` | peppercorn red. Primary actions and the chosen slot only |
| `--primary-foreground` | `#FBF7EF` | `#1B1714` | text on primary |
| `--destructive` | `#8A2A1B` | `#E4846F` | cancel a booking, delete |
| `--radius` | `0.125rem` | same | near-square corners, like cut paper |

One accent. Status is shown with words and rules, not with a traffic-light palette:
a cancelled booking is struck through in muted ink, not painted red.

## 2. Typography

- **Display:** Instrument Serif, 400, with its italic used for one word of emphasis
  per heading at most. Tracking `-0.01em`, leading `1.05`. Scale:
  `clamp(2.25rem, 6vw, 4rem)` for the salon name, `1.75rem` for page headings.
- **Body and UI:** Familjen Grotesk, 400 and 600. Leading `1.5`, measure capped at
  `62ch`. Left aligned everywhere. No centred body copy.
- **Figures and the logs:** Spline Sans Mono, 400. Times, prices, durations, tool
  names and the agent call log. Tabular, so columns of times line up.
- **Loaded via:** `next/font/google` in `src/app/layout.tsx`, exposed as
  `--font-display`, `--font-sans`, `--font-mono`.
- **Substituted:** none.

## 3. Elevation and shape

No shadows anywhere. Structure comes from 1px rules in `--border` and from a double
rule (two 1px lines, 3px apart) under major headings, like a letterpress price list.
A "card" is a sheet: `--card` fill, 1px border, no shadow, `--radius` corners. Use one
only when content needs separating from the page; a list separated by rules is
preferred.

## 4. Layout and density

- Client pages: single column, `max-w-xl`, left aligned, 16px gutters on a phone.
  The step number ("1 of 3") sits in the left margin on wide screens and hangs
  outside the text column. That is the deliberate break in the grid.
- The salon name on the front page is set large and runs to the left edge of the
  column with the address and hours set small in mono beside it, not under it.
- Owner's diary: full width up to `max-w-7xl`. One column per stylist, time down the
  left in mono, hour lines ruled across. Bookings are blocks with a 3px left rule in
  `--primary`, no fill colour coding.
- System page logs: a ruled table in mono at `1rem` minimum, so it reads from the back
  of a room on a projector. A "large type" toggle takes it to `1.25rem`.

## 5. Motion

Almost nothing. Focus rings and a 120ms colour change on hover. New rows in the agent
call log fade in over 200ms (`opacity` only) so the room can see a call arrive. No
entrance animations, no parallax, no moving backgrounds.

## 6. Components

- Buttons: square-ish (`--radius`), 600 weight, sentence case. Primary is solid
  `--primary`. One primary action per screen. Secondary is a 1px outline.
- Time slots: a grid of outlined mono buttons. The chosen one is solid `--primary`.
  Taken times are not shown at all, rather than shown disabled.
- Inputs: 1px border, paper fill, label above in 600, never a floating label.
- Navigation (owner): a plain text row under a rule. The current page is underlined.
- Empty states: one sentence saying what goes here and one action. No illustration.
- Consent screen: the two buttons are the same outline weight. Approve is not primary.

## 7. Banned in this project

- Gradients of any kind, glows, blurs, glass, floating rounded cards with soft shadows.
- Inter, Roboto, Arial, Space Grotesk, system font stacks.
- Centred body copy.
- Three equal feature cards in a row.
- Invented proof: testimonials, star ratings, client counts, press logos.
- Emoji as icons. Icons only where a word will not fit, from lucide, 1.5px stroke.
- Colour-coded status pills. Say the status in words.
- `h-screen`. Use `min-h-[100dvh]`.
- Hex codes in components. Tokens only.
- Round fake numbers in sample data.
- The words: seamless, elevate, effortless, unlock, experience (as a noun for a haircut).

## 8. Provenance

No site was used as a reference. The direction comes from the brief (a small salon,
phone-first, shown on a projector) and the owner's standing rule against the default
AI look. Fonts are open-licence Google Fonts served from the app's own domain by
`next/font`. No assets, copy or CSS were taken from anywhere.
