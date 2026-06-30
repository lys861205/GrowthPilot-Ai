import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { audits, pages, suggestions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { crawlSite } from "@/lib/crawler";
import { analyzeSite } from "@/lib/seo/scorer";
import { createAuditWorker, type AuditJobData, type AuditJobResult } from "@/lib/redis/queue";
import { publishStreamEvent } from "@/lib/redis/publish";
import { generateSuggestions } from "@/lib/qwen/suggestions";
import { generateGrowthRecommendations } from "@/lib/qwen/growth";
import { saveAuditMemory } from "@/lib/agent/memory";
import {
  pushScoreHistory,
  setAuditSnapshot,
  pushRecsSnapshot,
  refreshUserContext,
  buildTopIssuesFromPages,
  buildScoreBreakdownFromPages,
} from "@/lib/redis/memory";
import { getUserContext } from "@/lib/redis/memory/context";
import { db as _db2 } from "@/lib/db";
import { growthRecommendations as growthRecsTable } from "@/lib/db/schema";
import { eq as _eq2 } from "drizzle-orm";
import type { Job } from "bullmq";

async function processAudit(
  job: Job<AuditJobData, AuditJobResult>
): Promise<AuditJobResult> {
  const { auditId, siteId, siteUrl } = job.data;

  const emit = (type: string, message: string, data?: object) =>
    publishStreamEvent(auditId, { type, message, data, ts: Date.now() });

  try {
    // ── Mark audit as running ──────────────────────────────────────────────
    await db
      .update(audits)
      .set({ status: "running", startedAt: new Date() })
      .where(eq(audits.id, auditId));

    await emit("start", `Starting audit for ${siteUrl}`);

    // ── Crawl ──────────────────────────────────────────────────────────────
    await emit("crawling", `Crawling pages on ${siteUrl}…`);

    const crawledPages = await crawlSite(siteUrl, async (page, idx) => {
      await emit("page_crawled", `Crawled: ${page.url}`, {
        url: page.url,
        index: idx,
        statusCode: page.statusCode,
      });
    });

    await emit("analyzing", `Analyzing ${crawledPages.length} pages…`);

    // ── Analyze ────────────────────────────────────────────────────────────
    const { overallScore, pageResults, totalIssues } =
      analyzeSite(crawledPages);

    // ── Persist pages ──────────────────────────────────────────────────────
    const insertedPages = await db
      .insert(pages)
      .values(
        pageResults.map((result, i) => {
          const raw = crawledPages[i];
          return {
            auditId,
            url: result.url,
            title: raw.title,
            metaDescription: raw.metaDescription,
            h1Count: raw.h1Tags.length,
            h2Count: raw.h2Tags.length,
            wordCount: raw.wordCount,
            internalLinks: raw.internalLinks.length,
            externalLinks: raw.externalLinks.length,
            imagesWithoutAlt: raw.imagesWithoutAlt,
            loadTimeMs: raw.loadTimeMs,
            statusCode: raw.statusCode,
            score: result.score,
            issues: result.issues,
          };
        })
      )
      .returning({ id: pages.id, url: pages.url, score: pages.score });

    await emit("suggestions", "Generating AI suggestions…");

    // ── Load site memory to inform AI suggestions ─────────────────────────
    const siteMemory = await getUserContext(job.data.userId, siteId).catch(() => null);

    // ── AI Suggestions (memory-aware) ─────────────────────────────────────
    const pageSuggestions = await generateSuggestions(
      pageResults.map((r, i) => ({
        pageId: insertedPages[i].id,
        url: r.url,
        score: r.score,
        issues: r.issues,
        title: crawledPages[i].title,
        metaDescription: crawledPages[i].metaDescription,
      })),
      auditId,
      siteMemory
    );

    if (pageSuggestions.length > 0) {
      await db.insert(suggestions).values(pageSuggestions);
    }

    await emit("growth", "Building growth recommendations…");

    // ── Growth Recommendations ─────────────────────────────────────────────
    await generateGrowthRecommendations({
      siteId,
      auditId,
      siteUrl,
      overallScore,
      pageResults,
      totalIssues,
    });

    // ── PG Memory ─────────────────────────────────────────────────────────
    await saveAuditMemory({
      siteId,
      auditId,
      overallScore,
      pagesCrawled: crawledPages.length,
      issuesFound: totalIssues,
      topIssues: getTopIssueTypes(pageResults),
    });

    // ── Redis Memory ──────────────────────────────────────────────────────
    const completedAt = new Date().toISOString();
    const pageRows = pageResults.map((r) => ({ score: r.score, issues: r.issues }));
    const topIssues = buildTopIssuesFromPages(pageRows);
    const scoreBreakdown = buildScoreBreakdownFromPages(pageRows);

    const siteRecord = await db.query.sites.findFirst({
      where: eq(audits.siteId, siteId),
      columns: { id: true, name: true, url: true },
    }).catch(() => null);

    await Promise.allSettled([
      // 1. Score history (sorted set)
      pushScoreHistory(siteId, {
        auditId,
        score: overallScore,
        pagesCrawled: crawledPages.length,
        issuesFound: totalIssues,
        completedAt,
      }),
      // 2. Audit snapshot (hash)
      setAuditSnapshot({
        auditId,
        siteId,
        siteName: siteRecord?.name ?? siteUrl,
        siteUrl,
        overallScore,
        pagesCrawled: crawledPages.length,
        issuesFound: totalIssues,
        completedAt,
        topIssues,
        scoreBreakdown,
      }),
      // 3. User context
      refreshUserContext(
        job.data.userId,
        siteId,
        auditId,
        overallScore,
        topIssues[0]?.type ?? ""
      ),
    ]);

    // Invalidate trend analysis cache so next page load regenerates
    redis.del(`trends:${siteId}`).catch(() => {});

    // 4. Recommendations snapshot (after growth recs are saved)
    const savedRecs = await _db2.query.growthRecommendations.findMany({
      where: _eq2(growthRecsTable.auditId, auditId),
    });
    if (savedRecs.length > 0) {
      await pushRecsSnapshot(siteId, {
        auditId,
        capturedAt: completedAt,
        items: savedRecs.map((r) => ({
          category: r.category,
          title:    r.title,
          impact:   r.impact,
          effort:   r.effort,
        })),
      }).catch(console.error);
    }

    // ── Mark done ────────────────────────────────────────────────────────
    await db
      .update(audits)
      .set({
        status: "done",
        overallScore,
        pagesCrawled: crawledPages.length,
        issuesFound: totalIssues,
        completedAt: new Date(),
      })
      .where(eq(audits.id, auditId));

    await emit("complete", `Audit complete. Score: ${overallScore}/100`, {
      overallScore,
      pagesCrawled: crawledPages.length,
      issuesFound: totalIssues,
    });

    return { auditId, overallScore, pagesCrawled: crawledPages.length, issuesFound: totalIssues };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";

    await db
      .update(audits)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(audits.id, auditId));

    await emit("error", `Audit failed: ${message}`);
    throw err;
  }
}

function getTopIssueTypes(
  pageResults: Array<{ issues: Array<{ type: string }> }>
): string[] {
  const counts: Record<string, number> = {};
  for (const page of pageResults) {
    for (const issue of page.issues) {
      counts[issue.type] = (counts[issue.type] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);
}

// ── Start worker process ───────────────────────────────────────────────────

const worker = createAuditWorker(processAudit);

worker.on("completed", (job, result) => {
  console.log(`[worker] Audit ${result.auditId} done. Score: ${result.overallScore}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Audit ${job?.data.auditId} failed:`, err.message);
});

console.log("[worker] Audit worker started, waiting for jobs…");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
