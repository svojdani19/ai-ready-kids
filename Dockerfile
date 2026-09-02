# Node 24 because the app stores everything in SQLite through `node:sqlite`,
# which is a stable built-in from Node 22.5 onward. No native module is
# compiled and no database server is involved: the whole store is one file.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# The database lives on the mounted volume, not in the image. Without this the
# file would be written into the container's own filesystem and every deploy
# would silently reset the demo school.
ENV AIRK_DB_PATH=/data/airk.db

# `output: "standalone"` leaves a self-contained server here, with only the
# dependencies the app imports.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# `public/` is empty in this project, and git does not track empty directories —
# so on a build sourced from GitHub the folder simply does not exist and this
# COPY fails the whole build. A tracked `.gitkeep` keeps it present. Left as a
# plain COPY rather than made optional, because a missing public directory
# should be loud rather than silently shipping without static assets.
COPY --from=build /app/public ./public

# The port is the platform's to choose, and this image does not argue with it.
#
# There was an `ENV PORT=3210` here, and it was worse than useless: Railway
# injects its own PORT, which overrode it, so the server bound 8080 while the
# generated domain pointed at 3210 and every request returned 502. The env var
# looked like it was setting the port and was in fact being ignored.
#
# Next's standalone server binds `process.env.PORT`, defaulting to 3000. Set
# PORT explicitly in the platform if you need it to match a fixed domain target
# — this deployment pins it to 3210 — and otherwise let the platform supply it.
CMD ["node", "server.js"]
