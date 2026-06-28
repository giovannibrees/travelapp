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
> I built a small personal travel dashboard on top of the DC Member API — it
> syncs my own trips two-way and adds weather/calendar/map niceties for my own
> use. A few members asked for it, so I'd like to share it as a **deploy-it-
> yourself** template: each person deploys their *own* copy to their *own*
> Cloudflare account and connects their *own* `dk_` key. I'm not hosting a
> service, not storing anyone else's data, and nobody logs into a shared
> instance — it's strictly "pull your own data into your own dashboard," and it
> only pushes trip *dates* to DC (never notes/plans), never deletes DC trips, and
> always points back to the DC app for the actual interactions.
>
> Repo (public, noncommercial license): https://github.com/giovannibrees/travelapp
>
> I read the API terms and believe self-hosted personal use is within them, but I
> wanted to give you a heads-up before I post it more widely in the community —
> if you'd rather I hold off, change anything, or add a notice, just say the word
> and I'll act on it right away.
>
> Thanks for shipping the Member API — it's great.
>
> — Giovanni
