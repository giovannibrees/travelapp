# ✈️ Travel — your own personal travel hub

A single-screen travel app you **host yourself**, for free, on your own
Cloudflare account. It syncs your trips two-way with your
[Dynamite Circle](https://dynamitecircle.com) account (using *your* DC Member
API key), then adds the stuff the DC app doesn't: a year calendar, a
"been there" world map, per-trip weather, currency, plug type, emergency
numbers, and one-tap "add to any calendar."

> **Personal, self-hosted, augments DC — it does not replace it.** Each person
> runs their *own* copy with their *own* key and their *own* data. Nobody logs
> into anyone else's instance; there is no shared server. This is the "pull your
> own data into your own dashboard" use the DC Member API is meant for.

## What you get

- 🔄 **Two-way DC trip sync** — add or edit a trip here and the **dates** sync to
  DC; trips you already have in DC show up here. (Only dates sync to DC — never
  your notes, hotels, or plans.)
- 🗓️ **Calendar overview** — 3 / 6 / 12-month view of where you're away, plus
  **"days away by year"** (tap a year for the per-trip breakdown).
- 🌍 **"Been there" world map** — every country you've visited, filled in, with
  visit counts.
- 🌦️ **Per-trip intel** — weather for your dates, currency vs €/$, plug type &
  voltage, local emergency number.
- 📅 **Add to any calendar** — one-tap `.ics` export for Apple / Google / Outlook.
- 📱 **Installs like an app** — "Add to Home Screen" on iPhone/Android (it's a PWA).
- 🔐 **Your own password** — set once, stays signed in for 30 days per device.

## Deploy your own (≈5 minutes, free)

### 1. Click the button

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/giovannibrees/travelapp)

This copies the repo into **your** GitHub, creates the Worker in **your**
Cloudflare account, and **auto-creates the KV namespace** it needs. (Free plan
is plenty.) When it finishes you'll get a URL like
`https://travelapp.<you>.workers.dev`.

### 2. Open the app and set your password

Open your new URL. The **first** person to log in sets the email + password —
so do this immediately. (Use any email; it's just your login.)

### 3. Paste your DC key — in the app, no dashboard needed

In DC, go to **dc.dynamitecircle.com → your profile menu → DC Member API Key**
and copy it (starts with `dk_`). Then in the app: **Settings → Connect DC →
paste the key → Save → Test connection.** Your trips start syncing both ways.

> Your key is stored only on **your** Worker, used only server-side, and never
> shown back to the browser in full. Hit **Disconnect** any time to remove it.

### 4. Add it to your phone

Open the URL in Safari/Chrome on your phone → **Share → Add to Home Screen.**
It now opens full-screen like a native app.

That's it. 🎉

<details>
<summary>Prefer the command line? (optional)</summary>

```bash
git clone https://github.com/giovannibrees/travelapp && cd travelapp
npm i -g wrangler && wrangler login
wrangler kv namespace create TRIPS      # paste the id into wrangler.toml
wrangler deploy
# then set your DC key in-app (Settings → Connect DC), or as a secret:
# echo "dk_your_key" | wrangler secret put DC_API_KEY
```
</details>

## Optional extras

All optional — the app is fully functional with just your DC key.

- **Google Calendar two-way sync**, **Gmail→trip parsing (via Claude)**, and
  **Calendly** are supported by the Worker but need their own credentials. Set
  them as Worker secrets if you want them (see `.dev.vars.example`). Without
  them, those features simply stay off.

## How it works

- `travel-app.html` / `public/index.html` — the front end (one file, vanilla JS).
- `worker.js` — the Cloudflare Worker: serves the app, gates it behind your
  password, runs the two-way DC sync (and the optional integrations), and stores
  everything in one KV namespace (`TRIPS`).
- `wrangler.toml` — Worker config: the KV binding and a 30-minute sync cron.

```
Trip: { id, dcId, from, to, start (YYYY-MM-DD), end, label, notes, segments[] }
```

Only trip **dates** are ever pushed to DC. Your notes and plans stay on your
Worker. The sync never deletes a DC trip.

## Privacy

Everything lives in **your** Cloudflare account: your trips in your KV, your DC
key on your Worker, behind your password. The maintainer of this repo has no
access to your instance or your data.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — free to run, modify, and self-host for
any **noncommercial** purpose. You may not sell it or use it commercially.
