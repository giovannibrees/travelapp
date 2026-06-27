# Travel hub - build brief

A personal travel app for one user. The app is the only screen. Everything else is a headless backend behind one Cloudflare Worker.

## Files in this repo
- `travel-app.html` - the front end. Done. Single file, vanilla JS, persists locally and talks to the worker via `GET /trips` and `POST /trips`. Do not rewrite it; only touch it if the trip/segment data shape below changes.
- `worker.js` - the Cloudflare Worker hub. Near complete. The DC functions are guesses and need finalizing against the real API (task 3).
- `wrangler.toml` - Worker config (cron + KV). Fill in the KV id.

## Architecture
- DC Member API: two-way trip sync. User enters trips in the app, worker mirrors them to DC and also pulls trips created directly in the DC app.
- Google Calendar: read events overlapping each trip as segments (hotels, rides the user already adds), and write one clean "Trip: X" event per trip.
- Gmail + Anthropic API: parse confirmation emails that only hit the inbox into segments.
- App endpoints: `GET /trips` returns consolidated trips with segments; `POST /trips` upserts a trip by id and merges manual plans with ingested ones.

## Data model (keep app and worker in sync)
Trip: `{ id, dcId, from, to, start (YYYY-MM-DD), end, label, notes, segments[], calEventId }`
Segment: `{ sid, source ("manual"|"calendar"|"gmail"), type ("flight"|"hotel"|"car"|"ride"|"rail"|"other"), name, address, start, end, conf }`
Rule that must hold: segments tagged `source:"manual"` are user-authored and a sync must NEVER delete or overwrite them. Ingested segments dedupe by `conf`.

## Tasks, in order

1. SECURITY FIRST. The DC API key was exposed and must be rotated at dc.dynamitecircle.com before anything else. Never hardcode any secret. Local dev secrets go in `.dev.vars` (gitignored); production secrets via `wrangler secret put`. Confirm `.gitignore` covers `.dev.vars` and any `.env`.

2. Add the official DC client to inspect the real API: clone `github.com/dynamitecircle/dc` (Python, stdlib only, also runs as an MCP server). Use it with the rotated key to fetch one of the user's own trips.

3. Finalize the DC integration in `worker.js`. Using a real trip response from the dc client:
   - Fix `mapDcTrip` and `toDcTrip` to the real field names.
   - Fix the trips URL and the auth header. The key looks like `dk_...`; confirm from the dc client whether it is sent as `Authorization: Bearer <key>` or a custom header such as `X-API-Key`. Match the client.
   - Verify the loop guard: pull matches on `dcId` first then on the from/to/start/end signature, push only sends trips with no `dcId` then stores the returned id. Round-trip a trip and confirm no duplicates appear in DC or the store.

4. Google OAuth. Create an OAuth client (Desktop or Web). Mint a refresh token with scopes `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/gmail.readonly` (OAuth Playground is fine). Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and optionally `GOOGLE_CALENDAR_ID`.

5. Deploy to Cloudflare. `wrangler kv namespace create TRIPS`, paste the id into `wrangler.toml`, `wrangler secret put` each secret (`DC_API_KEY`, `ANTHROPIC_API_KEY`, the Google trio, optional `CALENDLY_TOKEN`), then `wrangler deploy`. Confirm the cron trigger is active.

6. Test end to end. `GET /trips` returns JSON. `POST /trips` with a small trip body creates it and mirrors to DC. Trigger `POST /sync`, then confirm: the trip appears in DC, a calendar event is written, and a calendar/Gmail booking inside the trip dates shows up as a segment. Manually add a plan via the app and confirm a later sync does not wipe it.

7. Open decision for the user: Google Calendar (already wired both ways) or Calendly. If Calendly, finish the `ingestFromCalendly` stub against the v2 `scheduled_events` API and call it inside `runSync`. Ask before building.

8. Hand back the deployed `*.workers.dev` URL. The user pastes it into the app under Settings, which flips it from Local to Synced.

## Migrating existing data
The user has trips/plans entered in the local app. They will export them via the app's Settings (Download) as JSON. After deploy, import that JSON back in the app, or POST each trip to `/trips`, so nothing entered manually is lost.
