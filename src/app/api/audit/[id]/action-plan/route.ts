import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { audits, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getScoreHistoryAsc,
  getUserContext,
  buildTopIssuesFromPages,
  buildScoreBreakdownFromPages,
} from "@/lib/redis/memory";
import { generateActionPlan } from "@/lib/qwen/action-plan";
import { redis } from "@/lib/redis";
import type { PageIssueRecord } from "@/lib/db/schema";

const CACHE_TTL = 60 * 60 * 24; // 24h — one plan per audit

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auditId } = await params;
  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { id: true, userId: true, url: true } } },
    columns: {
      id: true, overallScore: true, pagesCrawled: true,
      issuesFound: true, siteId: true, status: true,
    },
  });

  if (!audit || audit.site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (audit.status !== "done") {
    return NextResponse.json({ error: "Audit not complete" }, { status: 422 });
  }

  // Cache per audit
  const cacheKey = `action-plan:${auditId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  // Load page issues for this audit
  const pageRows = await db.query.pages.findMany({
    where: eq(pages.auditId, auditId),
    columns: { score: true, issues: true },
  });

  const typedRows = pageRows.map((p) => ({
    score: p.score ?? 0,
    issues: (p.issues ?? []) as PageIssueRecord[],
  }));

  const topIssues    = buildTopIssuesFromPages(typedRows);
  const scoreBreakdown = buildScoreBreakdownFromPages(typedRows);

  // Enrich with history context from Redis (optional — best effort)
  const siteId = audit.siteId;
  const [history, userCtx] = await Promise.all([
    getScoreHistoryAsc(siteId, 10).catch(() => []),
    getUserContext(session.user.id, siteId).catch(() => null),
  ]);

  const previousScore =
    history.length >= 2
      ? history[history.length - 2].score
      : undefined;

  try {
    const plan = await generateActionPlan({
      siteUrl:       audit.site.url,
      latestScore:   audit.overallScore ?? 0,
      pagesCrawled:  audit.pagesCrawled ?? 0,
      issuesFound:   audit.issuesFound  ?? 0,
      topIssues,
      scoreBreakdown,
      previousScore,
      persistentIssues: userCtx?.topPersistentIssue
        ? [userCtx.topPersistentIssue]
        : undefined,
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(plan));
    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Bust cache (e.g. user wants a fresh plan)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auditId } = await params;
  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
    columns: { id: true },
  });

  if (!audit || audit.site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await redis.del(`action-plan:${auditId}`);
  return NextResponse.json({ ok: true });
}
