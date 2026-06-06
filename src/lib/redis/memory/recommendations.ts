import { redis } from "@/lib/redis";
import { K, TTL, type RecsSnapshot } from "./keys";

const MAX_SNAPSHOTS = 5; // keep last 5 audit recommendation sets

// ─── Write ────────────────────────────────────────────────────────────────────

export async function pushRecsSnapshot(
  siteId: string,
  snapshot: RecsSnapshot
): Promise<void> {
  const key = K.recsLatest(siteId);

  await redis
    .multi()
    .lpush(key, JSON.stringify(snapshot))
    .ltrim(key, 0, MAX_SNAPSHOTS - 1)   // keep only newest N
    .expire(key, TTL.RECS_LATEST)
    .exec();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getRecsSnapshots(
  siteId: string,
  limit = MAX_SNAPSHOTS
): Promise<RecsSnapshot[]> {
  const key = K.recsLatest(siteId);
  const raw = await redis.lrange(key, 0, limit - 1);
  return raw.map((s) => JSON.parse(s) as RecsSnapshot);
}

export async function getLatestRecs(siteId: string): Promise<RecsSnapshot | null> {
  const snapshots = await getRecsSnapshots(siteId, 1);
  return snapshots[0] ?? null;
}

// ─── Seed from PostgreSQL ─────────────────────────────────────────────────────

import { db } from "@/lib/db";
import { growthRecommendations, audits } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function warmRecsForSite(siteId: string): Promise<void> {
  // Load last 3 audits' recommendations
  const recentAudits = await db.query.audits.findMany({
    where: eq(audits.siteId, siteId),
    orderBy: desc(audits.completedAt),
    limit: 3,
    columns: { id: true, completedAt: true },
  });

  for (const audit of recentAudits.reverse()) {
    const recs = await db.query.growthRecommendations.findMany({
      where: eq(growthRecommendations.auditId, audit.id),
    });

    if (recs.length === 0) continue;

    await pushRecsSnapshot(siteId, {
      auditId:    audit.id,
      capturedAt: (audit.completedAt ?? new Date()).toISOString(),
      items:      recs.map((r) => ({
        category: r.category,
        title:    r.title,
        impact:   r.impact,
        effort:   r.effort,
      })),
    });
  }
}
