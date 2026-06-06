# syntax=docker/dockerfile:1

# ── Stage 1: Build Next.js ────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 2: Runtime — all 5 services via supervisord ────────────────────────
FROM node:22-bookworm-slim AS runner

# Install PostgreSQL 15, Redis, supervisord
RUN apt-get update && apt-get install -y \
    postgresql-15 \
    redis-server \
    supervisor \
    postgresql-client-15 \
    && rm -rf /var/lib/apt/lists/*

# Init PostgreSQL data directory
USER postgres
RUN /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data \
    && echo "host all all 127.0.0.1/32 trust" >> /var/lib/postgresql/data/pg_hba.conf \
    && echo "listen_addresses='localhost'" >> /var/lib/postgresql/data/postgresql.conf
USER root

RUN mkdir -p /var/log/supervisor

# ── Copy Next.js standalone output ───────────────────────────────────────────
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy config files
COPY supervisord.conf /etc/supervisor/conf.d/growthpilot.conf
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://postgres@localhost:5432/growthpilot
ENV REDIS_URL=redis://localhost:6379
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["/usr/local/bin/entrypoint.sh"]
