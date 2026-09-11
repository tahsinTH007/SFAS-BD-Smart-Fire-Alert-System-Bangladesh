# Deploying SFAS-BD

Three hosted pieces, all on free tiers:

```
 Browser ──▶ Vercel (Next.js console)  ──HTTP + WebSocket──▶ Render (Express API + Socket.IO
                                                              + built-in device simulator)
                                                                        │
                                                                        ▼
                                                              MongoDB Atlas (M0, free)
```

**Why not everything on Vercel?** Vercel runs short-lived serverless
functions. The API keeps a WebSocket open to every console and runs the device
simulator on a timer — both need one process that stays up. Render's free web
service is that process. (Railway or Fly.io work the same way; the env vars
below are identical.)

**What the demo shows.** With `DEVICE_SIMULATOR=true` the API runs four
synthetic OGNIBORMO units through the *real* ingest pipeline — risk fusion,
alert de-duplication, socket push, reading history, device online status. A
fresh boot demonstrates every case within five minutes: a fire (Critical,
~1 min), a kitchen smoking without alarming (~2 min), a smoulder escalating to
fire (~3 min), a gas leak (~4 min) — then incidents come at random, a few per
hour per unit. The Settings page labels the feed as simulated.

---

## The values you will collect

| # | Value | Where it comes from | Where it goes |
|---|---|---|---|
| 1 | `MONGO_URI` | Atlas → Database → **Connect** → Drivers | Render env var |
| 2 | API URL, e.g. `https://sfas-bd-api.onrender.com` | Render, after the first deploy | Vercel env vars `NEXT_PUBLIC_API_BASE_URL` (add `/api/v1`) and `NEXT_PUBLIC_SOCKET_URL`; Render env var `BASE_URL` |
| 3 | Console URL, e.g. `https://sfas-bd.vercel.app` | Vercel, after the first deploy | Render env vars `CORS_ALLOWED_ORIGINS` and `SOCKET_CORS_ORIGIN` |

Values 2 and 3 depend on each other, so the order is: Atlas → Render (with a
wildcard CORS placeholder) → Vercel → tighten CORS on Render.

---

## 1. MongoDB Atlas

1. <https://cloud.mongodb.com> → create a project → **Build a Database** →
   **M0 Free** → region **Mumbai (ap-south-1)** or **Singapore** (nearest to
   Render's Singapore region).
2. **Database Access** → Add New Database User → password auth. Use a
   password with no `@ : / ? #` characters, or URL-encode it.
3. **Network Access** → Add IP Address → **Allow access from anywhere**
   (`0.0.0.0/0`). Render's free tier has no fixed egress IP, so a narrower
   allowlist cannot work.
4. **Database → Connect → Drivers** → copy the string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
   ```
   That whole thing is `MONGO_URI`. The database name is a separate variable
   (`DB_NAME=smartFireAlertSystem`); leave the path in the URI empty.

### Seed it

Run the seed scripts **from your PC** against Atlas — Render's shell is not
needed. In `backend/`:

```bash
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/" npm run seed
```

```bash
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/" npm run seed:units
```

(PowerShell: `$env:MONGO_URI="..."; npm run seed`.)

To carry your existing local data across instead, export it and import into
Atlas:

```bash
npm run export:data
```

```bash
MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/" npm run import:data
```

> **"querySrv ECONNREFUSED" from your PC?** Some ISPs and routers block the
> DNS SRV lookup a `mongodb+srv://` string needs. Either set your PC's DNS to
> `8.8.8.8`, or in Atlas choose **Connect → Drivers → "I have an older
> driver"** to get the long `mongodb://host1,host2,host3/…` form, which needs
> no SRV lookup. Render is not affected.

---

## 2. Render (API)

The repo ships a [`render.yaml`](render.yaml) Blueprint that creates the
service with everything preset except four secrets.

1. <https://dashboard.render.com> → **New → Blueprint** → connect the GitHub
   repository → Render finds `render.yaml` → **Apply**.
2. It prompts for the `sync: false` values:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | from Atlas (step 1) |
   | `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app` for now — tightened in step 4 |
   | `SOCKET_CORS_ORIGIN` | `https://*.vercel.app` for now |
   | `BASE_URL` | leave blank for now — you get the URL after the first deploy |

3. First deploy takes ~3 minutes (`npm ci` → `tsc`). When it is live, note
   the URL: `https://sfas-bd-api.onrender.com` (yours will differ). Set
   `BASE_URL` to it in **Environment**.
4. Check <https://sfas-bd-api.onrender.com/api/v1/health/ready> — you should
   see `mongodb.up: true` and `simulator.up: true` with four units listed.

Everything else in `render.yaml` is already set: `SERIAL_ENABLED=false` (no
board), `REDIS_ENABLED=false` (no Redis — caching off, rate limiting
in-memory), `DEVICE_SIMULATOR=true`, thresholds at the simulator defaults.

**Doing it by hand instead of the Blueprint?** New → Web Service → repo →
Root Directory `backend`, Build `npm ci --include=dev && npm run build`,
Start `npm start`, Health check `/api/v1/health/live`, then add every env var
listed in `render.yaml`.

### Free-tier sleep

Render's free service sleeps after 15 minutes without traffic and takes
30–60 s to wake on the next request. The console handles this: API calls
retry with backoff for about a minute and the socket reconnects on its own,
so the first visitor sees a loading state, not an error. Each wake is a fresh
boot, which also means the scripted opening incidents replay for them.

To keep it awake around the clock (750 free hours/month covers one service
24/7), point a free uptime monitor such as UptimeRobot at
`/api/v1/health/live` every 5 minutes.

---

## 3. Vercel (console)

1. <https://vercel.com/new> → import the GitHub repository.
2. **Root Directory → Edit → `frontend`.** This is the one setting that
   matters; without it Vercel looks for a Next.js app at the repo root and
   fails. Framework preset detects as Next.js.
3. **Environment Variables** — both are required; the console is on a
   different host from the API so it cannot infer them:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://sfas-bd-api.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://sfas-bd-api.onrender.com` |

   These are inlined at build time. Change them later → **Redeploy**.
4. **Deploy.** Note the URL, e.g. `https://sfas-bd.vercel.app`.

---

## 4. Close the loop

Back on Render → the service → **Environment**:

| Variable | Final value |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://sfas-bd.vercel.app,https://*.vercel.app` |
| `SOCKET_CORS_ORIGIN` | `https://sfas-bd.vercel.app` |

The wildcard keeps Vercel's preview deployments (`sfas-bd-git-<branch>-<team>.vercel.app`)
working; it matches exactly one DNS label, never a different domain. Saving
restarts the service.

---

## 5. Verify

Open the Vercel URL:

- **Dashboard → Overview → System health:** MongoDB UP, Sensor feed UP
  ("4 simulated units reporting"), Live socket UP. Redis shows OFFLINE
  "Disabled" — expected.
- **Dashboard → Live Sensors:** four units marked LIVE with sparklines
  moving every few seconds; the other units in the station show "awaiting
  data".
- **Settings → System status:** the four units and their current phase.
- Within a minute of a fresh boot a full-screen **Critical fire alert** takes
  over the screen. Acknowledge it, open the incident, dispatch a unit.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Console shows "Cannot reach the API" toasts after ~1 min | API not up. Open `<api>/api/v1/health/live` directly. If Render shows a build error, it is almost always `MONGO_URI` (typo, unencoded password, or Atlas network access not `0.0.0.0/0`). |
| Browser console: *blocked by CORS policy* | The Vercel origin is not in `CORS_ALLOWED_ORIGINS` on Render. Must include the scheme, no trailing slash. |
| "Live socket: Reconnecting…" while the API is fine | `SOCKET_CORS_ORIGIN` / `CORS_ALLOWED_ORIGINS` again, or `NEXT_PUBLIC_SOCKET_URL` has a path on the end (it must be the bare origin). |
| Health says `simulator.up: false` | `DEVICE_SIMULATOR` is not `"true"`, or the database has no devices — run `npm run seed` against Atlas. The API retries every 60 s once devices exist. |
| Everything is empty after deploy | Seeding was skipped (step 1). |
| Vercel build fails with "no Next.js version detected" | Root Directory is not set to `frontend`. |

### Storage budget on Atlas M0 (512 MB)

Readings expire after 7 days (TTL index). The simulator stores about one
reading per 10 s per quiet unit and every frame during an incident — roughly
50 k documents a day, ~90 MB steady state for four units. Alerts are kept
indefinitely at a few per hour; use the alert console's bulk delete if the
list ever needs pruning.

### Security

There is still **no authentication** — anyone with the URL can acknowledge,
resolve and delete alerts and edit devices. Fine for a demo; add auth before
treating the hosted console as anything more.
