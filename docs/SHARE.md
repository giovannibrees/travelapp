# Sharing kit

Copy/paste templates for sharing the self-hosted app with DC members. Edit to taste.

---

## A. Post for the DC AI / tools channel

> **I built a little self-hosted travel hub on top of the DC Member API — sharing it free 🌍✈️**
>
> It's a personal dashboard that syncs your trips two-way with DC (using *your own*
> DC Member API key) and adds the stuff I always wanted: a year calendar, a
> "been there" world map with visit counts, per-trip weather, currency vs €/$,
> plug type, local emergency number, and one-tap "add to any calendar." Installs
> on your phone like an app.
>
> Important: it's **self-hosted** — you deploy your *own* copy to your *own* free
> Cloudflare account with your *own* key and your *own* data. I don't run a
> server, I never see your data, nobody logs into anyone else's instance. It just
> pulls *your* DC data into *your* dashboard (the personal use the API is for) and
> sends you back to the DC app for the real interactions.
>
> One-click deploy + a 5-min guide here: **https://github.com/giovannibrees/travelapp**
> (Deploy to Cloudflare → set a password → paste your `dk_` key in Settings → done.)
>
> Free, noncommercial (PolyForm-NC license). Feedback & PRs welcome 🙏

---

## B. Courtesy heads-up email to the DC dev team

**To:** bugs+api@dynamitecircle.com
**Subject:** Heads-up: sharing a self-hosted, personal travel dashboard built on the Member API

> Hi DC dev team,
>
> I'm a DC member, and I built a small personal travel dashboard on top of the
> Member API — it pulls my own trips into a simple view (a month/year calendar of
> when I'm away, two-way trip sync, and one place for my hotels/flights/notes),
> plus a few extras like weather and a "been there" map.
>
> A few members saw it and asked for it, so I'd like to share it as a
> **deploy-it-yourself template** rather than a hosted service. Each person
> deploys their own copy to their own Cloudflare account and connects their own
> `dk_` key, which means:
>
> - I don't host anything or store anyone else's data — there's no shared server,
>   and nobody logs into my instance.
> - It's strictly "pull your own data into your own dashboard."
> - It only pushes trip *dates* to DC (never notes or plans), never deletes DC
>   trips, and always links back to the DC app for the real interactions. It
>   augments DC, it doesn't replace it.
>
> Repo (public, noncommercial license): https://github.com/giovannibrees/travelapp
>
> I've read the API terms and believe self-hosted personal use sits within them,
> but I wanted to give you a heads-up before I share it more widely with members
> (e.g. the AI channel) — if you'd prefer I hold off, change anything, or add a
> notice, just let me know and I'll act on it right away.
>
> Thanks for building the Member API — it's genuinely great to work with.
>
> Best,
> Giovanni
> Giovanni@giovannibrees.com
