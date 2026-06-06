import { redis } from "@/lib/redis";
import { K, TTL, type CompareResult } from "./keys";
import { resolveAuditSnapshot } from "./audit";
import { getBlogsBetween } from "./blog";

// ─── Core comparison logic ────────────────────────────────────────────────────

function computeDiff(
  a: Awaited<ReturnType<typeof resolveAuditSnapshot>>,
  b: Awaited<ReturnType<typeof resolveAuditSnapshot>>,
  blogsBetween: number
): CompareResult {
  if (!a || !b) throw new Error("Cannot compare: snapshot missing");

  const scoreDelta = b.overallScore - a.overallScore;

  const trend: CompareResult["trend"] =
    scoreDelta > 5 ? "improving" :
    scoreDelta < -5 ? "declining" : "stable";

  // Issue sets (by type string)
  const issuesA = new Set(a.topIssues.map((i) => i.type));
  const issuesB = new Set(b.topIssues.map((i) => i.type));

  const resolvedIssues  = [...issuesA].filter((t) => !issuesB.has(t));
  const newIssues       = [...issuesB].filter((t) => !issuesA.has(t));
  const persistentIssues = [...issuesA].filter((t) => issuesB.has(t));

  // Category changes
  const catMapA = Object.fromEntries(a.scoreBreakdown.map((c) => [c.category, c.score]));
  const catMapB = Object.fromEntries(b.scoreBreakdown.map((c) => [c.category, c.score]));
  const categoryChanges: CompareResult["categoryChanges"] = {};

  for (const cat of Object.keys(catMapA)) {
    const before = catMapA[cat] ?? 0;
    const after  = catMapB[cat] ?? 0;
    const delta  = after - before;
    if (delta !== 0) {
      categoryChanges[cat] = { before, after, delta };
    }
  }

  // Summary sentence
  const scoreStr   = scoreDelta > 0 ? `+${scoreDelta}` : String(scoreDelta);
  const fixedStr   = resolvedIssues.length > 0 ? `Fixed ${resolvedIssues.length} issue type(s). ` : "";
  const newStr     = newIssues.length > 0 ? `${newIssues.length} new issue type(s) appeared. ` : "";
  const blogStr    = blogsBetween > 0 ? `${blogsBetween} blog post(s) published between audits.` : "";

  const trendLabel = trend === "improving" ? "↑ Improving" : trend === "declining" ? "↓ Declining" : "→ Stable";

  const summary =
    `Score ${scoreStr} (${trendLabel}). ${fixedStr}${newStr}${blogStr}`.trim();

  return {
    auditIdA:         a.auditId,
    auditIdB:         b.auditId,
    scoreDelta,
    trend,
    resolvedIssues,
    newIssues,
    persistentIssues,
    categoryChanges,
    pagesDelta:       b.pagesCrawled - a.pagesCrawled,
    issuesDelta:      b.issuesFound - a.issuesFound,
    blogsBetween,
    summary,
    generatedAt:      new Date().toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function compareAudits(
  auditIdA: string,
  auditIdB: string,
  siteId: string
): Promise<CompareResult> {
  // 1. Check cache (canonical key order)
  const cacheKey = K.compareCache(auditIdA, auditIdB);
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as CompareResult;

  // 2. Resolve snapshots (Redis → warm from PG if needed)
  const [snapA, snapB] = await Promise.all([
    resolveAuditSnapshot(auditIdA),
    resolveAuditSnapshot(auditIdB),
  ]);

  if (!snapA || !snapB) {
    throw new Error(`Audit snapshot not found for ${!snapA ? auditIdA : auditIdB}`);
  }

  // 3. Count blog posts published between the two audits
  const dateA = new Date(snapA.completedAt);
  const dateB = new Date(snapB.completedAt);
  const [from, to] = dateA < dateB ? [dateA, dateB] : [dateB, dateA];
  const blogs = await getBlogsBetween(siteId, from, to);

  // 4. Compute
  // Ensure A is the earlier audit, B the later
  const [older, newer] = dateA < dateB ? [snapA, snapB] : [snapB, snapA];
  const result = computeDiff(older, newer, blogs.length);

  // 5. Cache result
  await redis.setex(cacheKey, TTL.COMPARE_CACHE, JSON.stringify(result));

  return result;
}

export async function invalidateCompareCache(
  auditIdA: string,
  auditIdB: string
): Promise<void> {
  await redis.del(K.compareCache(auditIdA, auditIdB));
}
