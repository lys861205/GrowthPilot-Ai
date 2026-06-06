# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local infra)
- A Qwen API key (or OpenAI-compatible endpoint)

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
```

### 4. Run database migrations

```bash
npm run db:push
```

Or generate + migrate:

```bash
npm run db:generate
npm run db:migrate
```

### 5. (Optional) Seed demo data

```bash
npm run db:seed
```

### 6. Start the Next.js dev server

```bash
npm run dev
```

### 7. Start the BullMQ worker (separate terminal)

```bash
npm run worker
```

The worker processes audit jobs from Redis. Both the web server and worker must be running for audits to complete.

---

## Production: Railway

Railway can run both the web server and the worker as separate services sharing the same environment.

### Step 1 — Create a Railway project

```bash
npm install -g @railway/cli
railway login
railway init
```

### Step 2 — Add PostgreSQL and Redis plugins

In the Railway dashboard, add:
- **PostgreSQL** plugin → copies `DATABASE_URL` into env
- **Redis** plugin → copies `REDIS_URL` into env

### Step 3 — Set environment variables

In Railway → Variables, add:

```
BETTER_AUTH_SECRET=<32+ char secret>
BETTER_AUTH_URL=https://<your-railway-domain>
QWEN_API_KEY=<your key>
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
NEXT_PUBLIC_APP_URL=https://<your-railway-domain>
```

### Step 4 — Deploy the web service

```bash
railway up
```

Add a start command in `railway.toml`:

```toml
[deploy]
startCommand = "npm run db:migrate && npm start"
```

### Step 5 — Deploy the worker as a separate service

In the Railway dashboard:
1. Add a new service from the same repo
2. Set the start command to: `node -r ts-node/register src/workers/audit-worker.ts`
   or if compiled: `node dist/workers/audit-worker.js`

For production worker, add a build step or use `tsx`:

```bash
npx tsx src/workers/audit-worker.ts
```

---

## Production: Vercel + External Worker

Vercel hosts the Next.js app; the BullMQ worker runs on any Node.js server (Railway, Fly.io, VPS).

### Step 1 — Deploy Next.js to Vercel

```bash
npx vercel --prod
```

Set all environment variables in the Vercel dashboard.

### Step 2 — Run the worker externally

On a Railway/Fly.io instance or VPS:

```bash
# Clone the repo
git clone <your-repo>
cd growthpilot

# Install deps
npm install --legacy-peer-deps --omit=dev

# Set env vars (DATABASE_URL, REDIS_URL, QWEN_API_KEY, etc.)

# Run worker
npx tsx src/workers/audit-worker.ts
```

> The worker and the web app must share the same `REDIS_URL` and `DATABASE_URL`.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `BETTER_AUTH_SECRET` | ✅ | Random secret for session signing |
| `BETTER_AUTH_URL` | ✅ | Full URL of the app (used for auth callbacks) |
| `QWEN_API_KEY` | ✅ | API key for Qwen / OpenAI-compatible LLM |
| `QWEN_BASE_URL` | ✅ | LLM API base URL |
| `QWEN_MODEL` | ✅ | Model name (e.g. `qwen-plus`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the app (used in client code) |

---

## Database Migrations in Production

Run migrations before starting the server:

```bash
npm run db:migrate
```

Or automate it in your start command:

```bash
npm run db:migrate && npm start
```

---

## Architecture Overview

```
Browser
  │
  ▼
Next.js App (Vercel / Railway)
  ├── App Router pages (SSR + Server Actions)
  ├── API routes (/api/*)
  │     └── SSE stream route (/api/audits/[id]/stream)
  └── Auth (better-auth)
        └── Session cookies

PostgreSQL (Railway / Supabase)
  └── Drizzle ORM

Redis (Railway / Upstash)
  ├── BullMQ job queue  ←── Audit jobs enqueued here
  └── SSE event buffer  ←── Worker pushes progress events here

BullMQ Worker (Railway / VPS)
  ├── Crawls site (Cheerio)
  ├── Scores pages (SEO checks)
  ├── Generates suggestions (Qwen AI)
  ├── Generates growth recs (Qwen AI)
  └── Saves memory + updates audit status
```
