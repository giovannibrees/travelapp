// Travel sync worker (Cloudflare)
// One hub. Your app is the only UI. Everything else is headless:
//   - DC Member API      two-way trip sync (you enter in your app, it mirrors to DC and pulls DC-origin trips)
//   - Google Calendar    reads events you already drop in (Booking, Airbnb...) as trip segments, writes one clean event per trip
//   - Gmail + Claude      parses confirmation emails (drivers, transfers) into segments
//   - TripIt API          OPTIONAL drop-in replacement for ingestion (see note in ingestSegments)
//
// Storage: one KV namespace bound as TRIPS, single JSON doc under key "store".
// Secrets (wrangler secret put NAME):
//   DC_API_KEY  ANTHROPIC_API_KEY
//   GOOGLE_CLIENT_ID  GOOGLE_CLIENT_SECRET  GOOGLE_REFRESH_TOKEN  GOOGLE_CALENDAR_ID(optional, default "primary")
//   CALENDLY_TOKEN (optional)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

    // Your app reads the consolidated, segment-enriched trips from here.
    if (url.pathname === "/trips" && request.method === "GET") {
      const store = await loadStore(env);
      return cors(json(Object.values(store.trips).sort((a, b) => (a.start < b.start ? -1 : 1))));
    }
    // Your app creates OR updates a trip here. Manual plans you edit are merged with ingested ones.
    if (url.pathname === "/trips" && request.method === "POST") {
      const store = await loadStore(env);
      const body = await request.json();
      const id = body.id || uid();
      const existing = store.trips[id];
      if (existing) {
        const ingested = (existing.segments || []).filter((s) => s.source && s.source !== "manual");
        const manual = (body.segments || []).filter((s) => !s.source || s.source === "manual");
        store.trips[id] = { ...existing, from: body.from, to: body.to, start: body.start, end: body.end,
          label: body.label, notes: body.notes || "", segments: dedupeSegs([...ingested, ...manual]), updatedAt: Date.now() };
      } else {
        store.trips[id] = { id, dcId: body.dcId || null, from: body.from || "", to: body.to || "",
          start: body.start, end: body.end, label: body.label || "", notes: body.notes || "", segments: body.segments || [], updatedAt: Date.now() };
      }
      await saveStore(env, store);
      ctx.waitUntil(runSync(env)); // mirror to DC + enrich right away
      return cors(json(store.trips[id]));
    }
    // Manual trigger (handy while testing). Cron calls runSync on its own.
    // Awaited so the response means the sync actually finished and the store is fresh.
    if (url.pathname === "/sync" && request.method === "POST") {
      await runSync(env);
      return cors(json({ ok: true }));
    }
    // TEMP diagnostic: shows exactly what the DC API returns. Remove once sync works.
    if (url.pathname === "/debug/dc" && request.method === "GET") {
      try {
        const res = await fetch(DC_BASE + "/trips", { headers: dcHeaders(env) });
        const text = await res.text();
        return cors(json({
          dcKeyPresent: !!env.DC_API_KEY,
          dcKeyPrefix: (env.DC_API_KEY || "").slice(0, 3),
          requestedUrl: DC_BASE + "/trips",
          status: res.status,
          ok: res.ok,
          bodyPreview: text.slice(0, 1500),
        }));
      } catch (e) {
        return cors(json({ error: String((e && e.message) || e) }));
      }
    }
    return new Response("Not found", { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env));
  },
};

async function runSync(env) {
  const store = await loadStore(env);
  try { await pullFromDC(store, env); }      catch (e) { console.error("DC pull", e); }
  try { await pushToDC(store, env); }        catch (e) { console.error("DC push", e); }
  try { await ingestFromCalendar(store, env); } catch (e) { console.error("calendar", e); }
  try { await ingestFromGmail(store, env); } catch (e) { console.error("gmail", e); }
  try { await writeTripsToCalendar(store, env); } catch (e) { console.error("cal write", e); }
  await saveStore(env, store);
}

/* ----------------------------- DC two-way ----------------------------- */
// Finalized against the official DC client (github.com/dynamitecircle/dc:
// py/dc.py) and its OpenAPI contract (contracts/openapi.json):
//   Base URL : https://api.dynamitecircle.com   (NOT dc.dynamitecircle.com)
//   Auth     : Authorization: Bearer dk_<key>   (Bearer, not a custom header)
//   Envelope : success { ok:true, data:{...} } ; error { ok:false, error, message }
//   GET  /trips                  -> data.trips[] (+ data.nextCursor). Each trip:
//        { tripID, note, location:{ city,name,description,placeID,... },
//          startDate, endDate, eventID, points[], roomID }
//   POST /trips { startDate, endDate, note, placeID|eventID } -> data.trip{ tripID }
//        startDate + endDate required; pass EXACTLY ONE of placeID / eventID.
//   GET  /places/search?q=&limit=1 -> data.places[0].placeID  (resolve a destination)
//
// The loop guard: every trip carries its DC id (dcId = tripID) once known.
// Pull matches on dcId first, then on signature (so a trip you JUST pushed is
// not re-created). Push only sends trips that have no dcId yet, then records the
// tripID DC returns. runSync pulls before it pushes.

const DC_BASE = "https://api.dynamitecircle.com";

function dcHeaders(env, extra) {
  return Object.assign(
    { Authorization: `Bearer ${env.DC_API_KEY}`, Accept: "application/json" },
    extra || {}
  );
}
// DC wraps every response as { ok, data } / { ok:false, error, message }.
async function dcGet(env, path) {
  const res = await fetch(DC_BASE + path, { headers: dcHeaders(env) });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.ok !== true) {
    throw new Error(`DC GET ${path} -> ${res.status} ${(body && body.error) || ""}`);
  }
  return body.data || {};
}
async function dcPost(env, path, payload) {
  const res = await fetch(DC_BASE + path, {
    method: "POST",
    headers: dcHeaders(env, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.ok !== true) {
    throw new Error(`DC POST ${path} -> ${res.status} ${(body && body.error) || ""}`);
  }
  return body.data || {};
}
// DC trips are created by placeID (or eventID), never free text. Resolve the
// app's free-text destination to a Google placeID DC accepts.
async function dcResolvePlaceId(env, query) {
  if (!query) return "";
  const data = await dcGet(env, `/places/search?q=${encodeURIComponent(query)}&limit=1`);
  const place = (data.places || [])[0];
  return (place && place.placeID) || "";
}

async function pullFromDC(store, env) {
  const data = await dcGet(env, "/trips");
  const dcTrips = data.trips || [];
  for (const dt of dcTrips) {
    const dcId = String(dt.tripID);
    const mapped = mapDcTrip(dt);
    let local = Object.values(store.trips).find((t) => t.dcId === dcId);
    if (!local) local = Object.values(store.trips).find((t) => !t.dcId && sig(t) === sig(mapped));
    if (local) {
      local.dcId = dcId;
      // Merge DC-owned fields, but never blank out local data: DC has no origin
      // field, and locally entered codes (e.g. "FNC") should not be wiped.
      for (const k of ["to", "start", "end", "label"]) if (mapped[k]) local[k] = mapped[k];
    } else {
      const id = uid();
      store.trips[id] = { id, dcId, from: "", ...mapped, segments: [], updatedAt: Date.now() };
    }
  }
}

async function pushToDC(store, env) {
  for (const t of Object.values(store.trips)) {
    if (t.dcId) continue;              // already mirrored, do not duplicate
    if (!t.start || !t.end) continue;  // DC requires startDate + endDate
    const placeID = await dcResolvePlaceId(env, t.to || t.label || t.from);
    if (!placeID) continue;            // no resolvable destination -> skip (try again next sync)
    const data = await dcPost(env, "/trips", toDcTrip(t, placeID));
    const trip = data.trip || data;
    if (trip && trip.tripID) t.dcId = String(trip.tripID);
  }
}

// DC -> app. DC trips are destination-only (no origin) and carry the label in
// `note`. Returns only DC-owned fields; the caller preserves local `from`.
function mapDcTrip(dt) {
  const loc = dt.location || {};
  return {
    to: loc.city || loc.name || loc.description || "",
    start: norm(dt.startDate),
    end: norm(dt.endDate),
    label: dt.note || loc.description || loc.city || "",
  };
}
// app -> DC. Destination is sent as a resolved placeID (see dcResolvePlaceId);
// DC has no origin field, so the app's `from` is folded into the note.
function toDcTrip(t, placeID) {
  const label = t.label || "";
  const note = t.from ? (label ? `${label} (from ${t.from})` : `from ${t.from}`) : label;
  const body = { startDate: t.start, endDate: t.end, note };
  if (placeID) body.placeID = placeID;
  return body;
}

/* --------------------------- Calendar ingest --------------------------- */
// Reads Google Calendar events overlapping each trip and attaches them as segments.
// This is the cleanest source: the Booking.com / Airbnb items you already add to your calendar.

async function ingestFromCalendar(store, env) {
  const token = await googleToken(env);
  const calId = env.GOOGLE_CALENDAR_ID || "primary";
  for (const t of Object.values(store.trips)) {
    if (!t.start || !t.end) continue;
    const timeMin = new Date(t.start + "T00:00:00Z").toISOString();
    const timeMax = new Date(t.end + "T23:59:59Z").toISOString();
    const u = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`
      + `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
    const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) continue;
    const data = await res.json();
    for (const ev of data.items || []) {
      if (ev.extendedProperties && ev.extendedProperties.private && ev.extendedProperties.private.travelSyncTrip) continue; // skip events we wrote
      const seg = {
        type: guessType(ev.summary || ""),
        name: ev.summary || "Event",
        start: norm(ev.start && (ev.start.dateTime || ev.start.date)),
        end: norm(ev.end && (ev.end.dateTime || ev.end.date)),
        address: ev.location || "",
        conf: "gcal:" + ev.id,
        source: "calendar",
      };
      addSegment(t, seg);
    }
  }
}

/* ----------------------------- Gmail ingest ---------------------------- */
// For confirmations that only land in email (drivers, transfers). Claude does the extraction.
// SWAP TO TRIPIT: if you would rather not maintain extraction, replace this whole function with a
// single GET https://api.tripit.com/v1/list/object/traveler/true/format/json (OAuth) and map the
// air/lodging/car objects into segments. Same downstream code.

async function ingestFromGmail(store, env) {
  const token = await googleToken(env);
  const q = "newer_than:120d (from:booking.com OR from:airbnb.com OR from:uber.com OR from:bolt.eu "
    + "OR subject:(confirmation OR itinerary OR reservation OR pickup))";
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) return;
  const list = await listRes.json();
  store.seenEmails = store.seenEmails || {};
  for (const m of list.messages || []) {
    if (store.seenEmails[m.id]) continue;
    store.seenEmails[m.id] = 1;
    const text = await gmailPlainText(token, m.id);
    if (!text) continue;
    const seg = await extractSegment(env, text);
    if (seg && seg.start) {
      seg.source = "gmail";
      const trip = findTripForDate(store, seg.start);
      if (trip) addSegment(trip, seg);
    }
  }
}

async function extractSegment(env, emailText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: "From this travel confirmation email, return ONLY a JSON object "
          + '{"type":"flight|hotel|car|ride|rail|other","name":"","start":"YYYY-MM-DD","end":"YYYY-MM-DD","address":"","conf":""}. '
          + "If it is not a real booking, return null. No prose.\n\n" + emailText.slice(0, 6000),
      }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const txt = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  try {
    const obj = JSON.parse(txt.replace(/```json|```/g, "").trim());
    if (!obj || obj === null) return null;
    obj.start = norm(obj.start); obj.end = norm(obj.end);
    return obj;
  } catch (_) { return null; }
}

/* --------------------------- Calendar write ---------------------------- */
// One tidy "Trip: X" event per trip, so the trip shows up on your calendar as a single block.

async function writeTripsToCalendar(store, env) {
  const token = await googleToken(env);
  const calId = env.GOOGLE_CALENDAR_ID || "primary";
  for (const t of Object.values(store.trips)) {
    if (!t.start || !t.end) continue;
    const body = {
      summary: `Trip: ${t.label || (t.to || "Travel")}`,
      start: { date: t.start },
      end: { date: addDay(t.end) }, // all-day end is exclusive
      description: (t.segments || []).map((s) => `${s.type}: ${s.name}`).join("\n"),
      extendedProperties: { private: { travelSyncTrip: t.id } },
    };
    const method = t.calEventId ? "PATCH" : "POST";
    const u = t.calEventId
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${t.calEventId}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;
    const res = await fetch(u, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { const ev = await res.json(); t.calEventId = ev.id; }
  }
}

/* ----------------------------- Calendly (optional) --------------------- */
// If you meant Calendly rather than Google Calendar, finish this and call it inside runSync.
// async function ingestFromCalendly(store, env) {
//   const res = await fetch("https://api.calendly.com/scheduled_events?user=YOUR_USER_URI",
//     { headers: { Authorization: `Bearer ${env.CALENDLY_TOKEN}` } });
//   const data = await res.json();
//   for (const ev of data.collection || []) { /* map ev to a segment, addSegment(trip, seg) */ }
// }

/* ------------------------------- helpers ------------------------------- */
async function googleToken(env) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token",
    }),
  });
  const d = await res.json();
  return d.access_token;
}

async function gmailPlainText(token, id) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return "";
  const msg = await res.json();
  const parts = [];
  (function walk(p) {
    if (!p) return;
    if (p.mimeType === "text/plain" && p.body && p.body.data) parts.push(b64(p.body.data));
    (p.parts || []).forEach(walk);
  })(msg.payload);
  return parts.join("\n");
}

function dedupeSegs(segs) {
  const seen = {}, out = [];
  for (const s of segs) {
    const key = s.conf || (s.type + "|" + s.name + "|" + s.start);
    if (seen[key]) continue;
    seen[key] = 1; out.push(s);
  }
  return out.sort((a, b) => ((a.start || "") < (b.start || "") ? -1 : 1));
}
function addSegment(trip, seg) {
  trip.segments = trip.segments || [];
  if (seg.conf && trip.segments.some((s) => s.conf === seg.conf)) return; // dedupe by confirmation id
  trip.segments.push(seg);
  trip.segments.sort((a, b) => ((a.start || "") < (b.start || "") ? -1 : 1));
  trip.updatedAt = Date.now();
}
function findTripForDate(store, dateISO) {
  return Object.values(store.trips).find((t) => t.start && t.end && dateISO >= t.start && dateISO <= t.end);
}
function guessType(s) {
  s = s.toLowerCase();
  if (/flight|airlines?|\b[a-z]{2}\d{2,4}\b/.test(s)) return "flight";
  if (/hotel|airbnb|booking|stay|inn|resort/.test(s)) return "hotel";
  if (/car|rental|hertz|avis|sixt/.test(s)) return "car";
  if (/uber|bolt|ride|pickup|driver|transfer/.test(s)) return "ride";
  if (/train|rail|sncf|trenitalia/.test(s)) return "rail";
  return "other";
}
function norm(d) { return d ? String(d).slice(0, 10) : ""; }
function addDay(iso) { const dt = new Date(iso + "T00:00:00Z"); dt.setUTCDate(dt.getUTCDate() + 1); return dt.toISOString().slice(0, 10); }
function sig(t) { return [t.from, t.to, t.start, t.end].join("|").toLowerCase(); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function b64(s) { return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))); }

async function loadStore(env) {
  const raw = await env.TRIPS.get("store");
  return raw ? JSON.parse(raw) : { trips: {}, seenEmails: {} };
}
async function saveStore(env, store) { await env.TRIPS.put("store", JSON.stringify(store)); }

function json(obj) { return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } }); }
function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(res.body, { status: res.status, headers: h });
}
