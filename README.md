# Travel

A personal travel hub for one user. The app is the only screen; everything else
is a headless backend behind a single Cloudflare Worker.

- **`travel-app.html`** - the front end. Single file, vanilla JS. Persists
  locally and talks to the worker via `GET /trips` and `POST /trips`. Tracks
  upcoming/past trips, per-trip plans (flights, hotels, rides), a fare-watch
  wishlist, JSON export/import for backup, and a shareable summary.
- **`worker.js`** - the Cloudflare Worker hub. Two-way trip sync with the DC
  Member API, Google Calendar read/write, and Gmail + Claude email parsing into
  trip segments. One KV namespace (`TRIPS`) holds the consolidated store.
- **`wrangler.toml`** - Worker config (30-minute cron + KV binding).
- **`CLAUDE.md`** - the build brief and ordered task list.
- **`design/`** - the new editorial redesign reference (`Travel.dc.html`) and
  its handoff spec (`HANDOFF.md`). The redesign is a re-skin that must preserve
  every functional feature of the current `travel-app.html` (sync, settings,
  status, export/import, manual-plan preservation, notes, `dcId`/`calEventId`).

## Architecture

| Source | Direction | What it does |
|---|---|---|
| DC Member API | two-way | Mirror app trips to DC; pull DC-origin trips back |
| Google Calendar | read + write | Read events overlapping a trip as segments; write one clean "Trip: X" event |
| Gmail + Claude | read | Parse confirmation emails into segments |

## Data model

```
Trip:    { id, dcId, from, to, start (YYYY-MM-DD), end, label, notes, segments[], calEventId }
Segment: { sid, source ("manual"|"calendar"|"gmail"), type ("flight"|"hotel"|"car"|"ride"|"rail"|"other"),
           name, address, start, end, conf }
```

**Invariant:** segments tagged `source:"manual"` are user-authored - a sync must
never delete or overwrite them. Ingested segments dedupe by `conf`.

## Secrets

No secret is ever committed. Local dev secrets go in `.dev.vars` (gitignored);
production secrets are set with `wrangler secret put`:

```
DC_API_KEY  ANTHROPIC_API_KEY
GOOGLE_CLIENT_ID  GOOGLE_CLIENT_SECRET  GOOGLE_REFRESH_TOKEN  GOOGLE_CALENDAR_ID (optional)
CALENDLY_TOKEN (optional)
```

## Status

Front end: working. Worker: near complete - the DC client functions
(`mapDcTrip`, `toDcTrip`, trips URL, auth header) are still being finalized
against the real DC API. Not yet deployed. See `CLAUDE.md` for the task order.

## License

Proprietary - all rights reserved. See [`LICENSE`](LICENSE).
