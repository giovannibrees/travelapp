# Handoff: Travel - personal trip & wishlist app

## Overview
A single-page personal travel app. The user tracks upcoming trips on a timeline
(flights, hotels, rides), keeps a fare-watch wishlist, edits trips and watches
through modals, and opens a 4:5 "travel log" card designed to be screenshotted
and posted to Instagram. The aesthetic is a bold editorial travel-journal:
warm paper canvas, near-black ink, electric cobalt + warm coral accents,
oversized display type over a monospace kicker.

## About the Design Files
`Travel.dc.html` is a **design reference created in HTML** - a working
prototype that shows the intended look, layout, copy, and interactions. It is
**not** production code to ship as-is. The task is to **recreate this design in
the target codebase's existing environment** (React, Vue, SwiftUI, native,
etc.) using that codebase's established patterns, component primitives, and
state libraries. If no environment exists yet, pick the most appropriate
framework and implement there.

Note: the file uses a small in-house template runtime (`<x-dc>`,
`support.js`, a `class Component extends DCLogic`). Treat that as an
implementation detail of the prototype - do not port the runtime. Port the
**markup, styles, copy, and behavior** described below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and
interactions. Recreate pixel-for-pixel using the codebase's libraries.
Exact hex values, fonts, and measurements are given below.

---

## Global Layout
- Page background: `#ECE7DC` (warm paper).
- Content is centered in a column with `max-width: 1140px` and horizontal
  padding `clamp(20px, 5vw, 72px)`; top padding `40px`, bottom `80px`.
- Vertical rhythm between major sections: ~16-34px (noted per section).
- Body text color `#16130C`. Antialiased.
- One-time page-load entrance: sections fade/translate up
  (`@keyframes riseIn: opacity 0 -> 1, translateY(16px) -> 0`), staggered
  with delays 0s / .08s / .14s, duration .6-.7s ease.

## Design Tokens
Colors (CSS custom properties on the root):
- `--canvas` `#ECE7DC` - page background (warm paper)
- `--ink` `#16130C` - primary text, dark hero/cards, primary buttons
- `--muted` `#756D5E` - secondary text / labels
- `--faint` `#A39A89` - placeholder text, "(optional)" hints
- `--line` `rgba(22,19,12,.12)` - hairline borders
- `--card` `#FFFFFF` - card surfaces
- `--cobalt` `#1E40FF` - primary accent (kicker, links, flight category)
- `--coral` `#FF5A35` - secondary accent (countdown, planes, highlights)
- `--amber` `#E89A2B` - reserved accent (defined, not heavily used)
- `--green` `#1B8A57` - hotel category, "LOCAL" status
- `--purple` `#7C4DFF` - ride category
- Cream text on dark surfaces: `#F4EFE4`

Typography (Google Fonts):
- Display: **Bricolage Grotesque** (weights 400-800). Used for headlines,
  numbers, trip titles. Tight tracking: `letter-spacing: -.02em` to `-.04em`.
- Body: **Archivo** (400-700). Used for paragraphs, buttons, form fields.
- Mono: **JetBrains Mono** (400/500/700). Used for kickers, labels, dates,
  badges - usually uppercase with wide tracking (`.1em`-`.32em`).

Radii:
- Pills / buttons / tabs: `999px`
- Large cards: `24px`-`28px`; stat cards `20px`; modals `26px`
- Plan/list inner blocks: `14px`-`18px`

Shadows:
- Hero: `0 30px 60px -28px rgba(22,19,12,.55)`
- Cards: `0 18px 40px -32px rgba(22,19,12,.5)`
- Modals: `0 40px 90px -30px rgba(0,0,0,.6)`
- Button hover lift: `0 6px 18px rgba(22,19,12,.1)` + `translateY(-1px/-2px)`

Spacing scale (observed): 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 34, 40 px.

Motion:
- `riseIn` (page load, see above).
- `floatPlane`: plane glyphs bob - `translate(0,0) rotate(0)` <->
  `translate(6px,-6px) rotate(-4deg)`, 3s ease-in-out infinite.
- `dashFlow`: the dashed route line scrolls - `background-position` to `-16px 0`,
  1s linear infinite (dashed gradient `14px` segments).
- `overlayIn`: modal backdrop fade .2s.
- `sheetIn`: modal/card spring in - `opacity 0->1`,
  `translateY(24px) scale(.97) -> translateY(0) scale(1)`,
  .28-.3s cubic-bezier(.2,.8,.2,1).
- Buttons: `transition: transform .15s ease` and/or box-shadow; hover lifts
  `-1px`/`-2px`.

Copy rule (project-wide): **use a regular hyphen `-` only**. Never em (—) or
en (–) dashes anywhere in copy or labels.

---

## Screens / Views
This is a single page. Top to bottom:

### 1. Header
- Layout: `flex`, `space-between`, `align-items: flex-start`, gap 24px.
- Left:
  - `h1` "Travel" - Bricolage 800, `font-size: clamp(54px, 9vw, 104px)`,
    `line-height: .82`, `letter-spacing: -.035em`.
  - Subtitle paragraph: "Every trip - its flights, stays and rides - on one
    living timeline." Archivo, 16px, `#756D5E`, `max-width: 440px`,
    `line-height: 1.45`.
  - (There is NO "Departures & Memories" kicker - it was removed.)
- Right (flex row, gap 10px):
  - **LOCAL** status badge: mono 11px 700, `letter-spacing: .14em`, green text
    `#1B8A57` on `rgba(27,138,87,.1)`, border `1px solid rgba(27,138,87,.28)`,
    padding `7px 12px`, pill. Leading 6px green dot.
  - **Share** button (opens Instagram overview): Archivo 600 14px, ink text,
    white bg, `1px solid --line`, padding `9px 18px`, pill. Hover: shadow +
    lift.
  - **Settings** button: same style as Share (no handler wired in prototype).

### 2. Hero - Next Trip (dark showcase)
- Container: `display: grid; grid-template-columns: 1.25fr 1fr`,
  `min-height: 320px`, `border-radius: 28px`, `overflow: hidden`,
  background `--ink`, text `#F4EFE4`, hero shadow. Margin-top 34px.
- Left cell (padding 36px 40px, flex column):
  - Top row: coral pill **NEXT TRIP** (mono 11px 700, `.2em`, coral bg, white
    text, padding `6px 12px`) + date "15-18 SEP 2026" (mono 12px,
    `rgba(244,239,228,.6)`).
  - Countdown: number **80** Bricolage 800
    `font-size: clamp(80px,12vw,128px)`, `line-height: .8`, next to a two-line
    label "days to" / "Funchal" (Bricolage 700 22px; "Funchal" in coral).
  - Route row: **OPO** -- dashed animated line -- plane glyph (coral, floats)
    -- **FNC**. Airport codes Bricolage 800 26px.
  - Actions row: **Open itinerary ->** button (cream `#F4EFE4` bg, ink text,
    Archivo 700 15px, pill, padding `13px 24px`, hover lift) + caption
    "Build Days - Madeira · 4 plans"  (NOTE: prototype caption still says
    "4 plans" here in the action row label - copy is
    "Build Days - Madeira · 4 days"; see Copy Inventory). Caption color
    `rgba(244,239,228,.65)`.
- Right cell: full-bleed destination photo (`object-fit: cover`) with a
  left-to-right gradient overlay
  `linear-gradient(90deg, #16130C 0%, rgba(22,19,12,.35) 35%, transparent 70%)`
  so the dark left cell blends into the photo.

### 3. Stats row
- `grid-template-columns: repeat(4, 1fr)`, gap 16px, margin-top 16px.
- Each card: white, `1px solid --line`, `border-radius: 20px`,
  padding `22px 24px`.
  - Big number: Bricolage 800 44px, `line-height: .9`, `letter-spacing: -.03em`.
  - Label: mono 11px, `letter-spacing: .12em`, uppercase, `#756D5E`,
    margin-top 8px.
- The four cards (number / label / number color):
  1. `1` / "Trips logged" / ink
  2. `1` / "Upcoming" / cobalt
  3. `4` / "Days travelling" / ink
  4. `80` / "Days to go" / coral

### 4. Tabs (segmented control)
- A pill container: white, `1px solid --line`, `border-radius: 999px`,
  padding 6px, `width: fit-content`, flex gap 6px. Margin-top 30px.
- Three buttons: "Upcoming" (count 1), "Past" (count 0), "Wishlist" (count 1).
  - Count is mono 12px at `opacity .55` next to the label.
  - Active tab: bg `--ink`, text `#F4EFE4`. Inactive: transparent bg,
    `#756D5E` text. Transition bg/color .18s.
  - Default active tab: **Upcoming**.

### 5a. Upcoming panel (default)
- Section header row: mono uppercase "Upcoming" label (left) + "+ Add trip"
  button (right; cobalt text on `rgba(30,64,255,.08)`, Archivo 700 13px, pill,
  hover bg `rgba(30,64,255,.16)`). Margin-top 22px.
- **Trip card** (white, `1px solid --line`, `border-radius: 24px`,
  card shadow, overflow hidden):
  - Header: `grid-template-columns: 200px 1fr`.
    - Left: destination photo (`object-fit: cover`, `min-height: 168px`).
    - Right (padding 24px 26px):
      - Route: **OPO** plane(cobalt) **FNC** (Bricolage 800 24px).
      - Title: "Build Days - Madeira" (Bricolage 700 20px).
      - Meta chips row: "15-18 Sep 2026" (mono 13px muted) +
        **4 DAYS** badge (mono 11px 700, ink bg, cream text, pill) +
        **IN 80 DAYS** badge (mono 11px 700, cobalt on `rgba(30,64,255,.1)`).
      - Top-right actions: **Edit** (white pill, ink text, hover bg `#F6F2E9`)
        and **Delete** (coral text, border `rgba(255,90,53,.3)`, hover bg
        `rgba(255,90,53,.08)`).
  - Toggle bar (full width button): bg `#F8F5EE`, top border `--line`,
    padding `14px 26px`, `space-between`. Left: three small rounded squares
    (cobalt/green/purple, 8px, radius 2px) + mono "ITINERARY". Right:
    "Show plans"/"Hide plans" label + caret (▼/▲). Toggles the plan list.
  - **Plan timeline** (shown when expanded; default expanded): padding
    `8px 26px 22px`. Each plan row is
    `grid-template-columns: 40px 1fr auto`, gap 14px, vertically centered,
    bottom border `--line`, padding `16px 0`:
    - Col 1: a 14px timeline dot, `border-radius: 50%`, color = category color,
      ringed with `box-shadow: 0 0 0 4px var(--card), 0 0 0 5px <color>`.
    - Col 2: title (Bricolage 700 16px) + a category tag pill
      (mono 10px 700, `.12em`, colored text on a light tint of the same color)
      + subtitle (13px `#756D5E`).
    - Col 3: date (mono 13px, ink, nowrap) + **Edit** small pill + an **×**
      circular icon button (28px, border `--line`, hover -> coral).
    - "+ Add plan" pill button at the bottom (cobalt on `rgba(30,64,255,.08)`).
  - Plan data (4 rows):
    1. "TAP TP1693 · OPO → FNC" / FLIGHT / "Porto to Funchal" / "15 Sep" /
       cobalt (tint `rgba(30,64,255,.1)`)
    2. "Castanheiro Boutique Hotel" / HOTEL / "Rua do Castanheiro 31, Funchal" /
       "15-18 Sep" / green (tint `rgba(27,138,87,.12)`)
    3. "Airport pickup" / RIDE / "FNC arrivals" / "15 Sep" /
       purple (tint `rgba(124,77,255,.12)`)
    4. "TAP TP1694 · FNC → OPO" / FLIGHT / "Funchal to Porto" / "18 Sep" /
       cobalt

### 5b. Past panel
- Empty state: white card, `1px dashed --line`, `border-radius: 24px`,
  padding `64px 24px`, centered.
  - Title: "No memories yet" (Bricolage 700 22px).
  - Paragraph: "When a trip wraps, it slides here with its photos, receipts and
    the route you actually flew." (`#756D5E`, `max-width: 360px`).

### 5c. Wishlist panel
- Section header: mono "Wishlist" + "+ Add watch" button (opens Add Watch
  modal; cobalt pill).
- **Wishlist card** (white, `1px solid --line`, `border-radius: 24px`,
  padding `26px 28px`, card shadow):
  - Title "Anywhere" (Bricolage 800 26px).
  - Constraint chips row:
    - "~**5** days" (mono 12px, `#F4F0E7` bg, `--line` border; the 5 is cobalt)
    - "August" (mono 12px 700, cobalt on `rgba(30,64,255,.08)`)
    - "under **€400**" (mono 12px, `#F4F0E7` bg; the €400 is cobalt)
  - Description: "Anywhere warm, flexible dates, direct if possible."
    (`#756D5E`, `max-width: 460px`).
  - Top-right: **Edit** (opens Add Watch modal) + **Delete** buttons (same
    styles as the trip card).
  - Primary CTA: **Watch fares from OPO** - ink bg, cream text, Archivo 700
    14px, pill, padding `12px 22px`, leading coral plane glyph, hover lift.

### 6. Edit Trip modal
- Trigger: any "Edit" on the trip card / plan rows / hero "Open itinerary"
  navigates to Upcoming (Open itinerary does NOT open this modal; Edit does).
- Backdrop: `position: fixed; inset: 0`, `rgba(22,19,12,.5)`,
  `backdrop-filter: blur(6px)`, centered, `z-index: 50`, `overlayIn`.
  Clicking the backdrop closes; clicks inside stop propagation.
- Sheet: white, `border-radius: 26px`, padding `32px 34px`,
  `max-width: 560px`, modal shadow, `sheetIn`.
  - Heading: mono "EDIT TRIP" 13px 700 `.22em`.
  - Fields in a `1fr 1fr` grid, gap `18px 20px`:
    - From (text, value "OPO"), To (text, value "FNC")
    - Departure (date, 2026-09-15), Return (date, 2026-09-18)
    - Label (text, "Build Days - Madeira") spanning both columns;
      label suffix "(optional)" in `--faint`.
  - Field style: 16px text, bg `#F6F2E9`, `1px solid --line`,
    `border-radius: 14px`, padding ~`13px 15px`. Focus: border cobalt,
    bg white. Field labels: 13px 600 `#756D5E`, margin-bottom 7px.
  - Footer (flex, gap 12px): **Cancel** (outline, `flex:1`, border ink) +
    **Save trip** (ink bg, cream text, `flex:1.4`, hover lift). Both close
    the modal in the prototype.

### 7. Add a Watch modal
- Trigger: "+ Add watch" or wishlist "Edit".
- Same backdrop / sheet / footer treatment as Edit Trip.
  - Heading: mono "ADD A WATCH".
  - Fields (stacked, with one 2-col row):
    - Destination (text, placeholder "Anywhere warm"); label suffix
      "(blank = anywhere)".
    - Row `1fr 1fr`: Ideal length (days) (placeholder "5") +
      Window (select: "Any month" / "August" / "Shoulder season").
    - Max price (text, placeholder "€400"); label suffix "(optional)".
    - Notes (textarea, 3 rows, placeholder "Direct flights, flexible dates…",
      vertical resize).
  - Footer: **Cancel** + **Add watch** (both close).

### 8. Share / Instagram overview overlay
- Trigger: header **Share** button.
- Backdrop: fixed, `rgba(22,19,12,.6)`, `backdrop-filter: blur(8px)`,
  centered, flex row gap 24px, `z-index: 60`, scrolls if tall, `overlayIn`.
  Backdrop click closes; inner clicks stop propagation.
- **The screenshot card** (4:5): fixed `width: 432px; height: 540px`,
  bg `--ink`, text `#F4EFE4`, `border-radius: 26px`, padding `34px 34px 28px`,
  flex column, modal shadow, `sheetIn`:
  - Header row: title "2026 / Travel log" (Bricolage 800 40px, `line-height .9`,
    "Travel log" on a new line) + a coral plane glyph top-right.
    (The "Departures & Memories" kicker here was removed.)
  - Trip list (flex column, gap 12px): per trip a card
    `grid-template-columns: 76px 1fr auto`, bg `rgba(244,239,228,.06)`,
    border `rgba(244,239,228,.1)`, radius 18px, padding 12px:
    - 76px square photo (radius 14, cover).
    - Middle: route "OPO -> FNC" (Bricolage 800 17px with coral plane),
      label (Archivo 600 14px, ellipsis), dates (mono 11px,
      `rgba(244,239,228,.6)`).
    - Right: big day count (Bricolage 800 26px, coral) over "days"
      (mono 9px `.12em` uppercase).
  - Footer (top border `rgba(244,239,228,.14)`): "1 TRIP · 4 DAYS ·
    1 DESTINATION" (mono 11px) + "@yourhandle" (mono 11px 700, coral).
- **Side panel** (white, `width: 280px`, radius 26px, padding 28px, shadow,
  `sheetIn` +.04s):
  - mono "SHARE" label.
  - Title "Ready for the grid" (Bricolage 800 24px).
  - Paragraph: "A 4:5 recap of every trip. Screenshot the card or grab the
    caption - then drop both into Instagram." (`#756D5E`).
  - **Copy caption** button (ink bg, cream text, full width, hover lift).
    Copies a caption string to clipboard and flips its own label to
    "Copied ✓" for 1.8s.
  - **Close** button (white, full width, border `--line`).
- Caption copied to clipboard:
  `"Build Days - Madeira ✈️ OPO → FNC · 15-18 Sep 2026\n4 days chasing sun on
  the rock. #Madeira #Funchal #travel"`

---

## Interactions & Behavior
- **Tabs**: clicking Upcoming/Past/Wishlist swaps the panel below. Active
  styling as described. Default `Upcoming`.
- **Itinerary toggle**: the toggle bar expands/collapses the plan timeline.
  Label switches "Show plans" <-> "Hide plans"; caret ▼ <-> ▲. Default expanded.
- **Hero "Open itinerary"**: switches to the Upcoming tab and forces the plan
  list expanded.
- **Edit / +Add trip / plan Edit**: open the Edit Trip modal.
- **+Add watch / wishlist Edit**: open the Add Watch modal.
- **Share**: opens the Instagram overview overlay.
- **Modals/overlays**: open with `sheetIn`, backdrop `overlayIn`; close on
  backdrop click or Cancel/Close/Save/Add; inner content stops click
  propagation. Cancel and primary actions both just close in the prototype
  (no persistence implemented).
- **Copy caption**: writes the caption to the clipboard
  (`navigator.clipboard.writeText`); button shows "Copied ✓" for 1.8s.
- **Hover states**: pill buttons lift (`translateY(-1px/-2px)`), some add the
  card hover shadow; the × icon button turns coral; tinted "add" buttons
  darken their tint. Inputs/selects/textarea focus -> cobalt border + white bg.

## Responsive / Mobile
The design is desktop-first with a single mobile breakpoint at **`max-width: 760px`**.
All base styling is inline; responsive overrides live in a small media-query
block (media queries cannot be expressed inline). In a real codebase, implement
these with your normal responsive tooling (CSS modules, Tailwind breakpoints,
styled-components, etc.). At <= 760px:
- **Page**: padding reduces to `22px 16px 56px`.
- **Header**: stacks vertically (`flex-direction: column`, `align-items:
  flex-start`, gap 18px); the LOCAL/Share/Settings row wraps.
- **Hero**: collapses to a single column; the destination photo moves to the
  **top** as a 180px banner (`order: -1`) and its overlay gradient flips to a
  bottom-up vertical fade (`linear-gradient(0deg, #16130C 2%, ... transparent)`)
  so it blends into the text below; text cell padding `26px 24px`. The
  countdown/headline use `clamp()` so they already scale down.
- **Stats**: 4-up grid becomes **2x2** (`repeat(2, 1fr)`).
- **Tabs**: stretch full width; each tab `flex: 1` and centers its label.
- **Trip card header**: collapses to one column; the photo becomes a 170px
  top banner.
- **Plan rows**: grid becomes `22px 1fr`; the date + Edit + × cluster wraps to
  its own full-width line under the title (`grid-column: 1 / -1`, left-padded
  ~34px to align under the content, `flex-wrap: wrap`).
- **Share overlay**: the 4:5 card and side panel **stack vertically** and
  center; card width `min(92vw, 432px)` with `aspect-ratio: 4 / 5`; side panel
  matches that width.
- **Modals**: padding reduces to `24px 20px`; their two-column field grids
  collapse to a single column.

Touch targets: all primary buttons/pills are >= 36-44px tall; keep >= 44px on
real mobile per platform guidance.

## State Management
Minimal local UI state (no backend in the prototype):
- `tab`: `'upcoming' | 'past' | 'wishlist'` (default `'upcoming'`).
- `expanded`: boolean for the plan timeline (default `true`).
- `editTripOpen`: boolean.
- `addWatchOpen`: boolean.
- `shareOpen`: boolean.
- `copied`: boolean (transient, for the copy-caption confirmation).
- Data is hardcoded in the prototype:
  - `plans[]` (4 items, fields: title, type, sub, date, color, tint).
  - `trips[]` for the share card (from, to, city, label, dates, days, photo).
  - `DEST_PHOTOS` lookup mapping IATA codes -> photo URL, with `destPhoto(code)`
    falling back to a generic travel image.
In a real build: replace hardcoded data with the app's trip/wishlist models;
wire the modal save handlers to create/update; persist as appropriate.

## Assets
- **Destination photography** is resolved automatically by destination, not
  uploaded. The prototype uses Wikimedia Commons via the stable
  `Special:FilePath` endpoint, e.g.
  `https://commons.wikimedia.org/wiki/Special:FilePath/Panorama_of_Funchal.jpg?width=1200`
  ("Panorama of Funchal", CC BY-SA - attribution required if reused).
  Pattern: key a destination -> a free-license image URL; width is controlled
  via `?width=`. For production, use a licensed image service or your own
  destination image set; honor each source's license/attribution.
- **Icons**: the plane is an inline SVG paper-plane glyph
  (`<path d="M2 11.5 21.5 3l-8.2 18.5-2.2-7.6-9.1-2.4Z"/>`, `fill: currentColor`).
  Category markers are plain colored dots/squares (no icon font). Caret is the
  Unicode ▼/▲. Replace with the codebase's icon set as preferred.
- **Fonts**: Bricolage Grotesque, Archivo, JetBrains Mono (Google Fonts).
- The `✈️` and `✓` characters appear only in the copied caption / button label,
  not as UI chrome.

## Files
- `Travel.dc.html` - the complete design reference (markup + styles + the
  prototype's interaction logic). All exact values can be read here.

## Notes for the developer
- Keep the **copy hyphen rule**: only `-`, never em/en dashes.
- The prototype's `<x-dc>` / `DCLogic` runtime is not meant to be ported -
  reimplement the component(s) idiomatically in your framework. The visual
  spec, copy, tokens, and behavior above are the contract.
- "Settings" and "Delete" buttons are visual only in the prototype.
