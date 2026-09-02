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
| `src/middleware.ts` | the site password, covering every route |

## Steps

**1. Create the project**

```bash
npm i -g @railway/cli
railway login
railway init
```

**2. Add a volume — do this before the first deploy**

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

1. The password page — and nothing else. Not the landing page, not the plans
   page, not a family take-home. Every route is behind it.
2. After the password, the site as you know it, landing on whatever link they
   were sent rather than being bounced to the home page.
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

Update `AIRK_SITE_PASSWORD` and redeploy. Every existing cookie stops working
immediately, because the cookie is signed with the password itself.

## Two things worth knowing

**The subscription term follows the clock.** A seeded school renews one year
from the day its database is created, so a fresh deploy is never a lapsed
school. This was a fixed date until it expired on 2026-09-02 and turned the whole
demo into a subscription-ended notice.

**`/_next/` is served without the password.** The gate page is an ordinary Next
route and needs its own stylesheet and chunks. Build artifacts are therefore
reachable by anyone who can guess a hashed filename, and a chunk can contain page
copy. It is the standard shape for this kind of curtain. If the requirement is
that no byte is reachable, the answer is HTTP basic auth at a proxy in front of
the app rather than middleware inside it — say so and I will set that up instead.
