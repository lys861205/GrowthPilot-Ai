# GrowthPilot AI

**Autonomous SEO & Content Agent powered by Qwen on Alibaba Cloud**

GrowthPilot AI is a fully autonomous B2B SEO platform that crawls your website, diagnoses issues, generates AI-powered fix recommendations, and continuously creates SEO-optimized content — all without manual intervention. Built for e-commerce stores and SMBs who can't afford an SEO agency.

> 🏆 Submitted to the [Global AI Hackathon Series with Qwen Cloud](https://qwencloud-hackathon.devpost.com/) — **MemoryAgent Track**

---

## The Problem

Small e-commerce businesses lose organic traffic every day because:
- SEO audits are expensive and infrequent
- Generic tools list problems but don't prioritize or explain fixes
- Content teams don't know which keywords to target
- Nobody remembers what changed between audits

## The Solution

GrowthPilot AI deploys three autonomous agents that work continuously:

| Agent | What it does |
|-------|-------------|
| **Audit Agent** | Crawls your site, scores every page, generates prioritized fixes via Qwen |
| **Blog Agent** | Analyzes GSC keyword gaps, generates full blog outlines + FAQ with Qwen |
| **Memory Agent** | Persists every audit to Redis, tracks score trends, surfaces insights over time |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / SSE (real-time stream)
┌───────────────────────▼─────────────────────────────────┐
│           Next.js 16 App  (Alibaba Cloud ECS)            │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│   │ App Router  │  │ API Routes   │  │ Auth          │  │
│   │ (SSR + RSC) │  │ /api/*       │  │ (better-auth) │  │
│   └─────────────┘  └──────────────┘  └───────────────┘  │
└───────────┬─────────────────┬───────────────────────────┘
            │                 │
    ┌───────▼──────┐  ┌──────▼────────┐
    │  PostgreSQL  │  │     Redis      │
    │  (Neon)      │  │  ┌──────────┐ │
    │              │  │  │ BullMQ   │ │  ←── Job Queues
    │  - users     │  │  │ Queues   │ │
    │  - sites     │  │  ├──────────┤ │
    │  - audits    │  │  │ Memory   │ │  ←── Audit History
    │  - pages     │  │  │ Layer    │ │       Score Trends
    │  - memories  │  │  ├──────────┤ │       AI Context
    │  - gsc_data  │  │  │ SSE      │ │  ←── Real-time Events
    └──────────────┘  │  │ Buffer   │ │
                      │  └──────────┘ │
                      └──────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐   ┌────────▼──────┐   ┌────────▼──────┐
│ Audit Worker │   │  Blog Agent   │   │  GSC Sync     │
│              │   │  Worker       │   │  Worker       │
│ 1. Crawl     │   │               │   │               │
│ 2. SEO check │   │ 1. Read GSC   │   │ Pull daily    │
│ 3. Score     │   │ 2. Find gaps  │   │ keyword data  │
│ 4. Qwen →    │   │ 3. Qwen →     │   │ from Google   │
│    Suggest   │   │    Outline    │   │ Search Console│
│ 5. Save      │   │ 4. Save ideas │   │               │
│    Memory    │   │               │   │               │
└──────────────┘   └───────────────┘   └───────────────┘
        │                    │
        └──────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │   Qwen API          │
        │   (DashScope)       │
        │   model: qwen-plus  │
        └─────────────────────┘
```

---

## Key Features

- **Real-time Audit Streaming** — Watch your site being crawled live via SSE
- **AI-Powered Suggestions** — Qwen generates specific, actionable fixes for every SEO issue
- **Memory-Driven AI** — After the first audit, every subsequent Qwen call is informed by the site's full history: total audits run, best/worst scores, average score change, and the most persistent unresolved issue — so suggestions never repeat and always focus on what actually matters
- **Striking Distance Keywords** — Automatically flags page 2–4 keywords with high impressions but low CTR
- **Blog Agent** — Autonomous background agent generates keyword-targeted blog outlines, FAQs, and meta tags
- **EEAT Content Injection** — Company context (expertise, authority, trust signals) is injected into every content prompt
- **Audit Comparison** — Compare any two audits side-by-side to measure improvement
- **Google Search Console Integration** — OAuth 2.0 connection syncs daily keyword metrics (impressions, clicks, CTR, position) via a dedicated background worker; data is stored per-site and used by Qwen to surface content opportunities

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Next.js API Routes, Server Actions |
| AI | Qwen (qwen3-plus via DashScope / Alibaba Cloud) |
| Database | PostgreSQL via Neon + Drizzle ORM |
| Queue | BullMQ + Redis (ioredis) |
| Memory | Redis (per-site audit history + AI context) |
| Auth | better-auth |
| Deployment | Alibaba Cloud ECS + Docker + Nginx |

---

## Quick Start

### Requirements
- Node.js 22+
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/lys861205/GrowthPilot-Ai.git
cd GrowthPilot-Ai
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Required variables:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
BETTER_AUTH_SECRET=<random-32-char-string>
QWEN_API_KEY=<your-dashscope-key>
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

### 3. Start Infrastructure
```bash
docker compose up -d   # starts PostgreSQL + Redis
```

### 4. Initialize Database & Run
```bash
npm run db:push
npm run dev
```

### 5. Start Background Workers
```bash
npm run worker:audit   # SEO crawler + Qwen suggestions
npm run worker:blog    # Autonomous blog idea generator
npm run worker:gsc     # Google Search Console sync
```

Visit `http://localhost:3000`

---

## Production Deployment (Alibaba Cloud ECS)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Docker + Nginx deployment guide.

The production stack runs as a single Docker container managed by `supervisord`, with all three workers running alongside the Next.js server.

---

## How Qwen Powers GrowthPilot

Every AI capability in GrowthPilot is backed by Qwen via the DashScope OpenAI-compatible API:

1. **Memory-Aware SEO Suggestions** — After crawling, Qwen receives the site's full audit history (past scores, persistent issues, average improvement rate) alongside current page issues, so each audit produces suggestions that build on previous ones rather than repeating them
2. **Action Plan** — Qwen synthesizes all audit findings into a structured 30-day action plan
3. **Blog Outlines** — Qwen generates full H2/H3 outlines, FAQ sections, and meta descriptions targeted to keyword gaps
4. **Trend Analysis** — Qwen interprets historical score data to surface growth insights
5. **Growth Recommendations** — Qwen categorizes opportunities by impact vs. effort
6. **GSC Keyword Intelligence** — Qwen analyzes Google Search Console data (impressions, clicks, CTR, position) to identify "striking distance" keywords (page 2–4 rankings with high impressions), explain why CTR is underperforming, and generate content strategies to capture untapped search demand

---

## License

MIT — see [LICENSE](./LICENSE)
