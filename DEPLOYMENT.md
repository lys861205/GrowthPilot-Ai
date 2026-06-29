# Deployment Guide

GrowthPilot AI is designed to be deployed as a unified Docker container using `supervisord`. This ensures that the Next.js web application and all background workers (Audit, Blog Agent, Google Search Console Sync) run together seamlessly.

## Prerequisites

- Docker & Docker Compose
- A Qwen API key (or OpenAI-compatible endpoint)
- Google Cloud Console Project (for GSC OAuth Integration)

---

## Local Development

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Start PostgreSQL + Redis

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/growthpilot
REDIS_URL=redis://localhost:6379

BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_URL=http://localhost:3000

QWEN_API_KEY=<your key>
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Search Console OAuth
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
```

### 4. Sync Database Schema

Instead of creating migration files during rapid prototyping, you can directly push the schema to your local database:

```bash
npm run db:push
```

### 5. Start the Next.js dev server

```bash
npm run dev
```

### 6. Start the Background Workers

GrowthPilot AI relies on background workers for data processing and automated AI tasks. You can run them in separate terminals:

```bash
npm run worker:audit  # Runs SEO Audits
npm run worker:blog   # Runs Autonomous Blog Generation
npm run worker:gsc    # Syncs Google Search Console data daily
```

---

## Production: Docker (Recommended)

GrowthPilot AI uses a unified Dockerfile that builds the Next.js application and packages it alongside `supervisord`. Supervisor manages both the Next.js production server and all background worker processes simultaneously within a single container.

### Step 1 — Prepare your Environment

You will need a Postgres database and a Redis instance (e.g., provided by Supabase, Upstash, or Railway plugins).

### Step 2 — Deploy using Docker (e.g., Railway, Render, Fly.io)

Most modern PaaS providers natively support Dockerfile deployments.

When you deploy the repository, the platform will automatically build the image using the provided `Dockerfile`.

The Docker container uses a custom entrypoint (`docker-entrypoint.sh`) which automatically runs:
1. `npx drizzle-kit push --force` (To ensure production database schema is up-to-date)
2. `supervisord` (To launch Next.js and all background workers)

### Step 3 — Set Environment Variables

In your deployment dashboard, provide the following variables:

- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (e.g., `https://your-production-domain.com`)
- `QWEN_API_KEY`, `QWEN_BASE_URL`, `QWEN_MODEL`
- `NEXT_PUBLIC_APP_URL` (e.g., `https://your-production-domain.com`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Crucial Note for Google OAuth**: Ensure that you add `https://your-production-domain.com/api/integrations/google/callback` to the **Authorized redirect URIs** in your Google Cloud Console.

### Step 4 — Verify Processes

Once deployed, Supervisor will automatically run and log:
- `program:app` (Next.js Node Server)
- `program:worker-audit` (SEO Crawler Worker)
- `program:worker-blog` (Blog Generation Worker)
- `program:worker-gsc` (GSC Daily Metrics Sync)

Logs for background workers can be found inside the container at `/var/log/supervisor/`.

---

## Architecture Overview

```
Browser
  │
  ▼
Next.js App (Supervisord Managed)
  ├── App Router pages (SSR + Server Actions)
  ├── API routes (/api/*)
  ├── Auth (better-auth)
  └── Google OAuth Integration
        └── /api/integrations/google/*

PostgreSQL
  └── Drizzle ORM (Synced via docker-entrypoint.sh)

Redis
  ├── BullMQ job queue  ←── Background jobs enqueued here
  └── SSE event buffer  ←── Real-time frontend updates

BullMQ Workers (Supervisord Managed)
  ├── worker-audit: Crawls site and scores SEO
  ├── worker-blog: Analyzes keywords and triggers Qwen content generation
  └── worker-gsc: Pulls daily Search Console metrics and saves to DB
```
