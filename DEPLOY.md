# Deploying to Railway

Everything here is prepared. **Nothing is deployed and nothing is purchased** —
these are the steps for you to run.

## Why Railway and not Vercel

The whole store is one SQLite file, opened through Node's built-in
`node:sqlite`. That needs a **persistent disk** and a **single long-running Node
process**. Vercel and Netlify give neither: their filesystem is ephemeral and
each request may hit a different instance, so the database would reset and fork.

Railway, Render and Fly all work. The config here is Railway's.

## What is already prepared

| File | Purpose |
| --- | --- |
| `Dockerfile` | Node 24 build, `output: "standalone"`, database path pointed at `/data` |
| `railway.json` | tells Railway to build from the Dockerfile |
| `.env.example` | the two variables that matter, with what happens if each is unset |
| `src/middleware.ts` | HTTP Basic auth, covering every route **and every asset** |

## Steps

**1. Create the project**

```bash
npm i -g @railway/cli
railway login
railway init
```

**2. Add a volume — do this before the first deploy**

Right-click the project canvas → **Volume** → pick the service → mount path.

In the Railway dashboard: **your service → Variables → Volumes → New Volume**,
mount path exactly:

```
/data
```

This is the one step that cannot be skipped. Without it the database is written
inside the container and **every deploy silently resets the demo school** — the
roster, the year of attempt history, all of it — back to seed.

**3. Set the two variables**

In the dashboard, or:

```bash
railway variables --set "AIRK_DB_PATH=/data/airk.db"
railway variables --set "AIRK_SITE_PASSWORD=choose-something-here"
```

`AIRK_DB_PATH` must match the volume mount. `AIRK_SITE_PASSWORD` is the shared
password in front of the whole site — pick it now; anyone you send the link to
needs it.

There is an optional third, `AIRK_SITE_USER`. Leave it unset and **any username
works**, so the only thing to pass on is the password. Set it if you want a
username too.

**And one more, `PORT`.** Railway injects its own `PORT` and the generated
domain has a target port; if the two disagree every request returns `502` while
the deployment reports itself healthy. This deployment sets:

```bash
railway variables --set "PORT=3210"
```

with the domain's target port also 3210. Either pin both like this, or set the
domain's target to whatever the deploy log shows the server bound to — the log
line is `- Local: http://<container>:<port>`.

**4. Deploy**

```bash
railway up
```

**5. Get the URL**

```bash
railway domain
```

First request seeds the database automatically: Brightwood Elementary, four
classes, 90 students and a year of fictional attempt history. Nothing to import.

## What a visitor sees

1. The browser's own password prompt, before a single byte of the site is
   served. Not the landing page, not the plans page, not a family take-home —
   and not a stylesheet or a script either. Any username, then the password.
2. After the password, the site as you know it, on whatever link they were sent.
   The browser remembers the credential for the rest of the session.
3. The sign-in page offers one-click **student**, **teacher** and
   **administrator** demo entry. Everyone past the password can be an
   administrator. That is deliberate for a demo — it is what makes it explorable
   in ten seconds — and it means **the site password is the only access control**.

## Resetting the demo

Visitors can change things: assign missions, add students, rotate codes, delete
class data. All of it is fictional and all of it is re-seedable.

```bash
railway run npm run db:reset
```

Or delete the volume and redeploy — first request re-seeds.

## Changing the password

Update `AIRK_SITE_PASSWORD` and redeploy. The old one stops working at once —
there is no cookie or session to expire, because every single request carries
the credential.

To close a visitor's own access sooner, they close the browser; there is no
sign-out for Basic auth. That is the honest limitation of this approach and the
reason it suits a preview rather than a product.

## Two things worth knowing

**The subscription term follows the clock.** A seeded school renews one year
from the day its database is created, so a fresh deploy is never a lapsed
school. This was a fixed date until it expired on 2026-09-02 and turned the whole
demo into a subscription-ended notice.

**Nothing at all is served without the password.** This started as a styled
password page, which forced `/_next/` to be public so the page could load its own
stylesheet — and a Next chunk can contain page copy. Basic auth needs no assets
before the prompt, so the allow-list is empty and the matcher is `/:path*`.
Verified against a production build: every route **and a hashed JS chunk** return
`401` without credentials, and `200` with them.

The cost is the browser's plain dialog instead of a designed page, and no
sign-out. For a preview handed to a named school, that is the right trade.
