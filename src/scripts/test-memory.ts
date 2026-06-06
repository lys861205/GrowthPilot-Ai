/**
 * Manual smoke test for the Redis memory layer.
 * Run: tsx --env-file=.env.local src/scripts/test-memory.ts
 */

import {
  pushScoreHistory,
  getScoreHistoryAsc,
  setAuditSnapshot,
  getAuditSnapshot,
  resolveAuditSnapshot,
  pushRecsSnapshot,
  getRecsSnapshots,
  upsertBlogEntry,
  getBlogIndex,
  getBlogsBetween,
  refreshUserContext,
  getUserContext,
  compareAudits,
  buildTopIssuesFromPages,
  buildScoreBreakdownFromPages,
} from "../lib/redis/memory";
import { redis } from "../lib/redis";
import type { PageIssueRecord } from "../lib/db/schema";

// ── Test IDs (fake, not in DB) ─────────────────────────────────────────────
const SITE_ID  = "test-site-00000000-0000-0000-0000-000000000001";
const AUDIT_A  = "test-audit-0000-0000-0000-0000-000000000001";
const AUDIT_B  = "test-audit-0000-0000-0000-0000-000000000002";
const USER_ID  = "test-user-0000-0000-0000-0000-000000000001";
const POST_ID  = "test-post-0000-0000-0000-0000-000000000001";

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label: string, err: unknown) {
  console.error(`  ✗  ${label}:`, err);
  failed++;
}

async function run() {
  console.log("\n=== Redis Memory Smoke Test ===\n");

  // ── 1. Score history ────────────────────────────────────────────────────
  console.log("1. Score history");
  try {
    await pushScoreHistory(SITE_ID, {
      auditId: AUDIT_A,
      score: 62,
      pagesCrawled: 10,
      issuesFound: 18,
      completedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
    });
    await pushScoreHistory(SITE_ID, {
      auditId: AUDIT_B,
      score: 75,
      pagesCrawled: 12,
      issuesFound: 11,
      completedAt: new Date().toISOString(),
    });
    ok("pushScoreHistory x2");

    const hist = await getScoreHistoryAsc(SITE_ID, 10);
    if (hist.length < 2) throw new Error(`Expected ≥2 entries, got ${hist.length}`);
    if (hist[0].score > hist[1].score) throw new Error("Not ascending order");
    ok(`getScoreHistoryAsc → ${hist.length} entries, scores: ${hist.map(h => h.score).join(", ")}`);
  } catch (e) { fail("score history", e); }

  // ── 2. Audit snapshots ──────────────────────────────────────────────────
  console.log("\n2. Audit snapshots");
  const pageRows: { score: number; issues: PageIssueRecord[] }[] = [
    { score: 55, issues: [{ type: "missing_title", severity: "high", message: "" }, { type: "thin_content", severity: "medium", message: "" }] },
    { score: 70, issues: [{ type: "slow_page", severity: "medium", message: "" }] },
    { score: 80, issues: [] },
  ];

  const topIssues = buildTopIssuesFromPages(pageRows);
  const scoreBreakdown = buildScoreBreakdownFromPages(pageRows);

  try {
    await setAuditSnapshot({
      auditId: AUDIT_A,
      siteId: SITE_ID,
      siteName: "Test Shop",
      siteUrl: "https://example.com",
      overallScore: 62,
      pagesCrawled: 10,
      issuesFound: 18,
      completedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
      topIssues,
      scoreBreakdown,
    });
    await setAuditSnapshot({
      auditId: AUDIT_B,
      siteId: SITE_ID,
      siteName: "Test Shop",
      siteUrl: "https://example.com",
      overallScore: 75,
      pagesCrawled: 12,
      issuesFound: 11,
      completedAt: new Date().toISOString(),
      topIssues: topIssues.slice(0, 1),
      scoreBreakdown,
    });
    ok("setAuditSnapshot x2");

    const snap = await getAuditSnapshot(AUDIT_A);
    if (!snap) throw new Error("Snapshot not found");
    if (snap.overallScore !== 62) throw new Error(`Score mismatch: ${snap.overallScore}`);
    ok(`getAuditSnapshot → score=${snap.overallScore}, issues=${snap.topIssues.length}`);

    const resolved = await resolveAuditSnapshot(AUDIT_A);
    if (!resolved) throw new Error("resolveAuditSnapshot returned null");
    ok("resolveAuditSnapshot (Redis hit)");
  } catch (e) { fail("audit snapshot", e); }

  // ── 3. Compare audits ───────────────────────────────────────────────────
  console.log("\n3. Audit comparison");
  try {
    const diff = await compareAudits(AUDIT_A, AUDIT_B, SITE_ID);
    if (diff.scoreDelta !== 13) throw new Error(`Expected delta 13, got ${diff.scoreDelta}`);
    ok(`compareAudits → delta=${diff.scoreDelta}, trend=${diff.trend}`);
    ok(`  resolvedIssues=[${diff.resolvedIssues.join(",")}]`);
    ok(`  summary: "${diff.summary}"`);

    // Second call should hit cache
    const diff2 = await compareAudits(AUDIT_A, AUDIT_B, SITE_ID);
    if (diff2.scoreDelta !== diff.scoreDelta) throw new Error("Cache returned different result");
    ok("compareAudits (cache hit) → same result");
  } catch (e) { fail("compare", e); }

  // ── 4. Recommendations snapshot ─────────────────────────────────────────
  console.log("\n4. Recommendations snapshot");
  try {
    await pushRecsSnapshot(SITE_ID, {
      auditId: AUDIT_A,
      capturedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
      items: [
        { category: "Content", title: "Add long-form content", impact: "high", effort: "medium" },
        { category: "Performance", title: "Compress images", impact: "medium", effort: "low" },
      ],
    });
    ok("pushRecsSnapshot");

    const recs = await getRecsSnapshots(SITE_ID, 5);
    if (recs.length === 0) throw new Error("No recs returned");
    ok(`getRecsSnapshots → ${recs.length} snapshot(s), latest has ${recs[0].items.length} items`);
  } catch (e) { fail("recs snapshot", e); }

  // ── 5. Blog index ───────────────────────────────────────────────────────
  console.log("\n5. Blog index");
  const oldDate = new Date(Date.now() - 5 * 86400_000);
  const newDate = new Date();
  try {
    await upsertBlogEntry(SITE_ID, {
      postId: POST_ID,
      title: "10 SEO Tips for E-Commerce",
      slug: "seo-tips-ecommerce",
      primaryKeyword: "ecommerce seo",
      seoScore: 82,
      wordCount: 1200,
      status: "published",
      auditId: AUDIT_A,
      createdAt: oldDate.toISOString(),
    });
    await upsertBlogEntry(SITE_ID, {
      postId: "test-post-2",
      title: "How to Write Product Descriptions",
      slug: "product-descriptions",
      primaryKeyword: "product descriptions",
      seoScore: 74,
      wordCount: 900,
      status: "draft",
      auditId: null,
      createdAt: newDate.toISOString(),
    });
    ok("upsertBlogEntry x2");

    const index = await getBlogIndex(SITE_ID);
    if (index.length < 2) throw new Error(`Expected ≥2 entries, got ${index.length}`);
    ok(`getBlogIndex → ${index.length} posts, latest="${index[0].title}"`);

    const between = await getBlogsBetween(
      SITE_ID,
      new Date(Date.now() - 2 * 86400_000),
      new Date(Date.now() + 86400_000)
    );
    if (between.length !== 1) throw new Error(`Expected 1 post between dates, got ${between.length}`);
    ok(`getBlogsBetween (last 2 days) → ${between.length} post`);
  } catch (e) { fail("blog index", e); }

  // ── 6. User context ─────────────────────────────────────────────────────
  console.log("\n6. User context");
  try {
    // Simulate 2 audits
    await refreshUserContext(USER_ID, SITE_ID, AUDIT_A, 62, "missing_title");
    await refreshUserContext(USER_ID, SITE_ID, AUDIT_B, 75, "thin_content");
    ok("refreshUserContext x2");

    const ctx = await getUserContext(USER_ID, SITE_ID);
    if (!ctx) throw new Error("Context not found");
    if (Number(ctx.totalAudits) !== 2) throw new Error(`Expected 2 audits, got ${ctx.totalAudits}`);
    if (Number(ctx.bestScore) !== 75) throw new Error(`Expected bestScore=75, got ${ctx.bestScore}`);
    ok(`getUserContext → totalAudits=${ctx.totalAudits}, best=${ctx.bestScore}, worst=${ctx.worstScore}, avgChange=${ctx.avgScoreChange}`);
  } catch (e) { fail("user context", e); }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n───────────────────────────────");
  console.log(`Results: ${passed} passed, ${failed} failed`);

  // Cleanup test keys
  const keys = await redis.keys(`*test-*`);
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`\nCleaned up ${keys.length} test keys`);
  }

  await redis.quit();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
