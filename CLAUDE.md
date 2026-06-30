# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 16.2.7 with React 19. APIs, conventions, and file structure may differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.

## Commands

```bash
# Dev
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint

# Database (Drizzle + Neon Postgres)
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Drizzle Studio UI

# Background workers (require .env.local)
npm run worker:audit   # BullMQ audit worker
npm run worker:blog    # BullMQ blog agent worker
npm run worker:gsc     # BullMQ GSC sync worker

# Scripts
npm run test:memory    # Test Redis memory layer
npm run backfill:redis # Backfill Redis from Postgres
```

Environment file is `.env.local`. See `.env.example` for required variables.

## Architecture

### Overview
GrowthPilot is an SEO SaaS with a Next.js frontend and three long-running BullMQ workers that run as separate processes (not serverless). The app audits websites, generates AI-powered SEO suggestions, and tracks keyword/content growth over time.

### Key layers

**Auth** — `better-auth` library at `src/lib/auth/`. Session token is checked in `src/middleware.ts` via cookie. All dashboard routes require auth.

**Database** — Drizzle ORM with Neon (serverless Postgres). Schema is in `src/lib/db/schema.ts`. All queries go through `src/lib/db/queries.ts` or inline in action files. Never use raw SQL outside migrations.

**AI** — Qwen models via an OpenAI-compatible API (`src/lib/qwen/client.ts`). The `qwen` client wraps `@ai-sdk/openai` pointed at Alibaba's DashScope endpoint. Model defaults to `qwen-plus` but is overridable via `QWEN_MODEL` env var. All AI calls live in `src/lib/qwen/`.

**Background workers** — Three BullMQ workers in `src/workers/`:
- `audit-worker.ts` — crawls site → runs SEO checks → calls Qwen for suggestions → saves Redis memory
- `blog-agent-worker.ts` — generates blog ideas from audit data via Qwen
- `gsc-sync-worker.ts` — syncs Google Search Console metrics

Workers are enqueued from API routes or server actions and communicate progress back to the frontend via Redis Pub/Sub (`src/lib/redis/publish.ts`). The frontend polls via SSE at `/api/audits/[id]/stream`.

**Redis memory layer** — `src/lib/redis/memory/` stores per-site audit history, score trends, and AI context as JSON in Redis. Keys are defined in `keys.ts`. This is separate from the BullMQ queue connection.

**SEO engine** — `src/lib/crawler/` (Cheerio-based crawler) → `src/lib/seo/checks.ts` (individual checks) → `src/lib/seo/scorer.ts` (aggregate scoring).

### Route groups
- `(auth)` — login/register, no sidebar
- `(dashboard)` — all `/dashboard/*` routes, uses `Sidebar` layout
- `(marketing)` — landing page, privacy, terms
- `api/` — REST + SSE endpoints; server actions are co-located in `actions.ts` files beside their pages

### UI
shadcn/ui components in `src/components/ui/`. Tailwind v4 (PostCSS plugin, no `tailwind.config.js`). Feature-specific components are grouped by domain under `src/components/`.
