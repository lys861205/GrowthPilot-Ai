import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sites, audits, pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getScoreHistoryAsc,
  resolveAuditSnapshot,
  buildTopIssuesFromPages,
  buildScoreBreakdownFromPages,
} from "@/lib/redis/memory";
import { analyzeTrends, type AuditSnapshot } from "@/lib/qwen/trend-analysis";
import { redis } from "@/lib/redis";
import type { PageIssueRecord } from "@/lib/db/schema";

const CACHE_TTL = 60 * 60 * 6;

// Load snapshots directly from PostgreSQL (no Redis write — read-only fallback)
async function snapshotsFromPg(siteId: string): Promise<AuditSnapshot[]> {
  const doneAudits = await db.query.audits.findMany({
    where: and(eq(audits.siteId, siteId), eq(audits.status, "done")),
    orderBy: (audits, { asc }) => [asc(audits.completedAt)],
    columns: {
      id: true, overallScore: true, pagesCrawled: true,
      issuesFound: true, completedAt: true,
    },
  });

  const snapshots: AuditSnapshot[] = [];

  for (const audit of doneAudits) {
    const completedAt = audit.completedAt?.toISOString() ?? new Date().toISOString();

    const pageRows = await db.query.pages.findMany({
      where: eq(pages.auditId, audit.id),
      columns: { score: true, issues: true },
    });

    const typedRows = pageRows.map((p) => ({
      score: p.score ?? 0,
      issues: (p.issues ?? []) as PageIssueRecord[],
    }));

    snapshots.push({
      auditId:      audit.id,
      completedAt,
      overallScore: audit.overallScore ?? 0,
      pagesCrawled: audit.pagesCrawled ?? 0,
      issuesFound:  audit.issuesFound  ?? 0,
      topIssues:    buildTopIssuesFromPages(typedRows),
      scoreBreakdown: buildScoreBreakdownFromPages(typedRows),
    });
  }

  return snapshots;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    columns: { id: true, userId: true, url: true },
  });

  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Cache hit
  const cacheKey = `trends:${siteId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  // 1. Try Redis history
  let snapshots: AuditSnapshot[] = [];
  const history = await getScoreHistoryAsc(siteId, 20);

  if (history.length >= 2) {
    const resolved = (
      await Promise.all(history.map((p) => resolveAuditSnapshot(p.auditId)))
    ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof resolveAuditSnapshot>>>[];
    snapshots = resolved;
  }

  // 2. Fall back to PostgreSQL if Redis is empty or incomplete
  if (snapshots.length < 2) {
    snapshots = await snapshotsFromPg(siteId);
  }

  if (snapshots.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 completed audits to analyze trends" },
      { status: 422 }
    );
  }

  try {
    const analysis = await analyzeTrends(site.url, snapshots);
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analysis));
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    columns: { id: true, userId: true },
  });

  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await redis.del(`trends:${siteId}`);
  return NextResponse.json({ ok: true });
}
