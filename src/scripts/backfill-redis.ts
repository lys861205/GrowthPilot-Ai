/**
 * Backfill Redis memory from existing PostgreSQL audit data.
 * Run: tsx --env-file=.env.local src/scripts/backfill-redis.ts
 *
 * Safe to run multiple times — Redis keys are overwritten idempotently.
 */

import { db } from "../lib/db";
import { audits, pages, sites, growthRecommendations } from "../lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  pushScoreHistory,
  setAuditSnapshot,
  pushRecsSnapshot,
  buildTopIssuesFromPages,
  buildScoreBreakdownFromPages,
} from "../lib/redis/memory";
import { redis } from "../lib/redis";
import type { PageIssueRecord } from "../lib/db/schema";

async function backfill() {
  console.log("\n=== Backfill Redis from PostgreSQL ===\n");

  // Load all done audits with their site
  const allAudits = await db.query.audits.findMany({
    where: eq(audits.status, "done"),
    with: {
      site: { columns: { id: true, name: true, url: true, userId: true } },
    },
    columns: {
      id: true,
      siteId: true,
      overallScore: true,
      pagesCrawled: true,
      issuesFound: true,
      completedAt: true,
    },
    orderBy: (audits, { asc }) => [asc(audits.completedAt)],
  });

  console.log(`Found ${allAudits.length} completed audits\n`);

  let ok = 0;
  let fail = 0;

  for (const audit of allAudits) {
    try {
      const completedAt = audit.completedAt?.toISOString() ?? new Date().toISOString();
      const score = audit.overallScore ?? 0;

      // Load pages for this audit to compute breakdowns
      const pageRows = await db.query.pages.findMany({
        where: eq(pages.auditId, audit.id),
        columns: { score: true, issues: true },
      });

      const typedPageRows = pageRows.map((p) => ({
        score: p.score ?? 0,
        issues: (p.issues ?? []) as PageIssueRecord[],
      }));

      const topIssues    = buildTopIssuesFromPages(typedPageRows);
      const scoreBreakdown = buildScoreBreakdownFromPages(typedPageRows);

      // 1. Score history (sorted set by timestamp)
      await pushScoreHistory(audit.siteId, {
        auditId:      audit.id,
        score,
        pagesCrawled: audit.pagesCrawled ?? 0,
        issuesFound:  audit.issuesFound  ?? 0,
        completedAt,
      });

      // 2. Audit snapshot (hash)
      await setAuditSnapshot({
        auditId:      audit.id,
        siteId:       audit.siteId,
        siteName:     audit.site?.name ?? audit.site?.url ?? "Unknown",
        siteUrl:      audit.site?.url  ?? "",
        overallScore: score,
        pagesCrawled: audit.pagesCrawled ?? 0,
        issuesFound:  audit.issuesFound  ?? 0,
        completedAt,
        topIssues,
        scoreBreakdown,
      });

      // 3. Recommendations snapshot
      const recs = await db.query.growthRecommendations.findMany({
        where: eq(growthRecommendations.auditId, audit.id),
        columns: { category: true, title: true, impact: true, effort: true },
      });

      if (recs.length > 0) {
        await pushRecsSnapshot(audit.siteId, {
          auditId:     audit.id,
          capturedAt:  completedAt,
          items:       recs.map((r) => ({
            category: r.category,
            title:    r.title,
            impact:   r.impact,
            effort:   r.effort,
          })),
        });
      }

      console.log(`  ✓  audit ${audit.id.slice(0, 8)}… site="${audit.site?.name}" score=${score} pages=${pageRows.length}`);
      ok++;
    } catch (err) {
      console.error(`  ✗  audit ${audit.id.slice(0, 8)}… failed:`, err);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} backfilled, ${fail} failed`);

  await redis.quit();
  process.exit(fail > 0 ? 1 : 0);
}

backfill().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
