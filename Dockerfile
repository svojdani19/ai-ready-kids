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
COPY --from=build /app/public ./public

# Railway sets PORT; the server binds it. 3210 is only the local default.
ENV PORT=3210
EXPOSE 3210
CMD ["node", "server.js"]
