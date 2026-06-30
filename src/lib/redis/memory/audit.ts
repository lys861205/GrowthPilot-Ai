import { redis } from "@/lib/redis";
import { K, TTL, type ScorePoint, type AuditSnapshot } from "./keys";

// ─── Score History (Sorted Set) ───────────────────────────────────────────────

export async function pushScoreHistory(
  siteId: string,
  point: ScorePoint
): Promise<void> {
  const key = K.scoreHistory(siteId);
  const ts = new Date(point.completedAt).getTime();

  await redis
    .multi()
    .zadd(key, ts, JSON.stringify(point))
    .zremrangebyrank(key, 0, -51) // keep newest 50 entries
    .expire(key, TTL.SCORE_HISTORY)
    .exec();
}

export async function getScoreHistory(
  siteId: string,
  limit = 20
): Promise<ScorePoint[]> {
  const key = K.scoreHistory(siteId);
  // Newest first
  const raw = await redis.zrevrange(key, 0, limit - 1);
  return raw.map((s) => JSON.parse(s) as ScorePoint);
}

export async function getScoreHistoryAsc(
  siteId: string,
  limit = 20
): Promise<ScorePoint[]> {
  const key = K.scoreHistory(siteId);
  const raw = await redis.zrange(key, -limit, -1);
  return raw.map((s) => JSON.parse(s) as ScorePoint);
}

export async function deleteScoreHistory(siteId: string): Promise<void> {
  await redis.del(K.scoreHistory(siteId));
}

// ─── Audit Snapshot (Hash) ────────────────────────────────────────────────────

export async function setAuditSnapshot(snapshot: AuditSnapshot): Promise<void> {
  const key = K.auditSnapshot(snapshot.auditId);

  await redis
    .multi()
    .hset(key, {
      auditId:        snapshot.auditId,
      siteId:         snapshot.siteId,
      siteName:       snapshot.siteName,
      siteUrl:        snapshot.siteUrl,
      overallScore:   String(snapshot.overallScore),
      pagesCrawled:   String(snapshot.pagesCrawled),
      issuesFound:    String(snapshot.issuesFound),
      completedAt:    snapshot.completedAt,
      topIssues:      JSON.stringify(snapshot.topIssues),
      scoreBreakdown: JSON.stringify(snapshot.scoreBreakdown),
    })
    .expire(key, TTL.AUDIT_SNAPSHOT)
    .exec();
}

export async function getAuditSnapshot(
  auditId: string
): Promise<AuditSnapshot | null> {
  const key = K.auditSnapshot(auditId);
  const data = await redis.hgetall(key);
  if (!data || !data.auditId) return null;

  return {
    auditId:        data.auditId,
    siteId:         data.siteId,
    siteName:       data.siteName,
    siteUrl:        data.siteUrl,
    overallScore:   Number(data.overallScore),
    pagesCrawled:   Number(data.pagesCrawled),
    issuesFound:    Number(data.issuesFound),
    completedAt:    data.completedAt,
    topIssues:      JSON.parse(data.topIssues ?? "[]"),
    scoreBreakdown: JSON.parse(data.scoreBreakdown ?? "[]"),
  };
}

export async function invalidateAuditSnapshot(auditId: string): Promise<void> {
  await redis.del(K.auditSnapshot(auditId));
}

// ─── Seed from PostgreSQL (called on cache miss) ──────────────────────────────

import { db } from "@/lib/db";
import { audits, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildScoreBreakdownFromPages, buildTopIssuesFromPages } from "./helpers";

export async function warmAuditSnapshot(auditId: string): Promise<AuditSnapshot | null> {
  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: true },
  });
  if (!audit || audit.status !== "done") return null;

  const auditPages = await db.query.pages.findMany({
    where: eq(pages.auditId, auditId),
    columns: { score: true, issues: true },
  });

  const snapshot: AuditSnapshot = {
    auditId,
    siteId:         audit.siteId,
    siteName:       audit.site.name,
    siteUrl:        audit.site.url,
    overallScore:   audit.overallScore ?? 0,
    pagesCrawled:   audit.pagesCrawled,
    issuesFound:    audit.issuesFound,
    completedAt:    (audit.completedAt ?? audit.createdAt).toISOString(),
    topIssues:      buildTopIssuesFromPages(auditPages),
    scoreBreakdown: buildScoreBreakdownFromPages(auditPages),
  };

  await setAuditSnapshot(snapshot);
  return snapshot;
}

// Three-level read: Redis → warm → null
export async function resolveAuditSnapshot(auditId: string): Promise<AuditSnapshot | null> {
  const cached = await getAuditSnapshot(auditId);
  if (cached) return cached;
  return warmAuditSnapshot(auditId);
}
