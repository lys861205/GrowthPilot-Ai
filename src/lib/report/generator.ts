import { db } from "@/lib/db";
import {
  audits,
  pages,
  suggestions,
  growthRecommendations,
  memories,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { PageIssueRecord } from "@/lib/db/schema";
import type {
  AuditReport,
  ScoreBreakdown,
  IssueFrequency,
  HistoricalPoint,
  OptimizedContentItem,
} from "./types";

const ISSUE_LABELS: Record<string, string> = {
  missing_title: "Missing title tag",
  title_too_short: "Title too short",
  title_too_long: "Title too long",
  missing_meta: "Missing meta description",
  meta_too_short: "Meta description too short",
  meta_too_long: "Meta description too long",
  missing_h1: "Missing H1 heading",
  multiple_h1: "Multiple H1 headings",
  no_h2: "No H2 subheadings",
  thin_content: "Thin content",
  low_word_count: "Low word count",
  images_missing_alt: "Images missing alt text",
  very_slow_page: "Very slow page load",
  slow_page: "Slow page load",
  moderate_load_time: "Moderate load time",
  no_internal_links: "No internal links",
  few_internal_links: "Few internal links",
  noindex: "Blocked from indexing",
  client_error: "Page returns 4xx error",
  server_error: "Page returns 5xx error",
  missing_canonical: "Missing canonical tag",
  canonical_mismatch: "Canonical URL mismatch",
  crawl_error: "Crawl failure",
};

// ─── Issue severity map for quick lookups ────────────────────────────────────

const HIGH_PRIORITY_ISSUES = new Set([
  "missing_title",
  "missing_h1",
  "thin_content",
  "noindex",
  "client_error",
  "server_error",
  "images_missing_alt",
  "very_slow_page",
  "crawl_error",
]);

// ─── Main report builder ──────────────────────────────────────────────────────

export async function buildAuditReport(auditId: string): Promise<AuditReport | null> {
  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: true },
  });

  if (!audit) return null;

  const [auditPages, auditSuggestions, growthRecs, siteMemories] =
    await Promise.all([
      db.query.pages.findMany({
        where: eq(pages.auditId, auditId),
        orderBy: (p, { asc }) => [asc(p.score)],
      }),
      db.query.suggestions.findMany({
        where: eq(suggestions.auditId, auditId),
        with: { page: { columns: { url: true, title: true } } },
        orderBy: (s, { asc }) => [asc(s.priority)],
      }),
      db.query.growthRecommendations.findMany({
        where: eq(growthRecommendations.siteId, audit.siteId),
        orderBy: [
          desc(growthRecommendations.impact),
          desc(growthRecommendations.createdAt),
        ],
      }),
      db.query.memories.findMany({
        where: eq(memories.siteId, audit.siteId),
        orderBy: desc(memories.createdAt),
        limit: 6,
      }),
    ]);

  const scoreBreakdown = buildScoreBreakdown(auditPages);
  const topIssues = buildTopIssues(auditPages);
  const history = buildHistory(siteMemories);
  const insights = buildInsights(audit.overallScore, topIssues, history, audit.pagesCrawled);
  const optimizedContent = buildOptimizedContent(auditSuggestions, auditPages);
  const issueCounts = buildIssueCounts(auditPages);

  const previousScore = history.find((h) => h.auditId !== auditId)?.score;
  const scoreChange =
    previousScore !== undefined && audit.overallScore !== null
      ? audit.overallScore - previousScore
      : null;

  const suggestionsByPriority = {
    high: auditSuggestions.filter((s) => s.priority === "high"),
    medium: auditSuggestions.filter((s) => s.priority === "medium"),
    low: auditSuggestions.filter((s) => s.priority === "low"),
  };

  return {
    audit,
    site: audit.site,
    pages: auditPages,
    suggestions: auditSuggestions,
    growthRecommendations: growthRecs,
    memories: siteMemories,
    scoreBreakdown,
    topIssues,
    history,
    insights,
    scoreChange,
    suggestionsByPriority,
    pagesByScore: [...auditPages].sort((a, b) => a.score - b.score),
    optimizedContent,
    issueCounts,
  };
}

// ─── Score breakdown by SEO category ────────────────────────────────────────

function buildScoreBreakdown(pages: Array<{ issues: PageIssueRecord[] | null; score: number }>): ScoreBreakdown[] {
  const categories: Record<string, { scores: number[]; issues: number; high: number }> = {
    "Title & Meta": { scores: [], issues: 0, high: 0 },
    "Headings": { scores: [], issues: 0, high: 0 },
    "Content": { scores: [], issues: 0, high: 0 },
    "Performance": { scores: [], issues: 0, high: 0 },
    "Indexability": { scores: [], issues: 0, high: 0 },
    "Images & Links": { scores: [], issues: 0, high: 0 },
  };

  const categoryMap: Record<string, string> = {
    missing_title: "Title & Meta",
    title_too_short: "Title & Meta",
    title_too_long: "Title & Meta",
    missing_meta: "Title & Meta",
    meta_too_short: "Title & Meta",
    meta_too_long: "Title & Meta",
    missing_canonical: "Title & Meta",
    canonical_mismatch: "Title & Meta",
    missing_h1: "Headings",
    multiple_h1: "Headings",
    no_h2: "Headings",
    thin_content: "Content",
    low_word_count: "Content",
    very_slow_page: "Performance",
    slow_page: "Performance",
    moderate_load_time: "Performance",
    noindex: "Indexability",
    client_error: "Indexability",
    server_error: "Indexability",
    crawl_error: "Indexability",
    images_missing_alt: "Images & Links",
    no_internal_links: "Images & Links",
    few_internal_links: "Images & Links",
  };

  for (const page of pages) {
    for (const issue of (page.issues ?? [])) {
      const cat = categoryMap[issue.type] ?? "Other";
      if (categories[cat]) {
        categories[cat].issues++;
        if (issue.severity === "high") categories[cat].high++;
      }
    }
  }

  return Object.entries(categories).map(([category, data]) => {
    const penaltyPerIssue = 8;
    const highPenalty = data.high * 5;
    const score = Math.max(0, 100 - data.issues * penaltyPerIssue - highPenalty);
    return { category, score, issueCount: data.issues, highCount: data.high };
  });
}

// ─── Top issues by frequency ─────────────────────────────────────────────────

function buildTopIssues(pages: Array<{ issues: PageIssueRecord[] | null }>): IssueFrequency[] {
  const counts: Record<string, { count: number; severity: "high" | "medium" | "low" }> = {};

  for (const page of pages) {
    for (const issue of (page.issues ?? [])) {
      if (!counts[issue.type]) {
        counts[issue.type] = { count: 0, severity: issue.severity };
      }
      counts[issue.type].count++;
    }
  }

  return Object.entries(counts)
    .map(([type, { count, severity }]) => ({
      type,
      label: ISSUE_LABELS[type] ?? type.replace(/_/g, " "),
      count,
      severity,
    }))
    .sort((a, b) => {
      // Sort high severity first, then by count
      const sevScore = { high: 3, medium: 2, low: 1 };
      const diff = sevScore[b.severity] - sevScore[a.severity];
      return diff !== 0 ? diff : b.count - a.count;
    })
    .slice(0, 8);
}

// ─── Score history from memories ─────────────────────────────────────────────

function buildHistory(mems: Array<{ auditId: string | null; content: any; createdAt: Date }>): HistoricalPoint[] {
  return mems
    .filter((m) => m.auditId && m.content?.overallScore !== undefined)
    .map((m) => ({
      auditId: m.auditId!,
      score: m.content.overallScore as number,
      pagesCrawled: (m.content.pagesCrawled as number) ?? 0,
      issuesFound: (m.content.issuesFound as number) ?? 0,
      completedAt: m.createdAt,
    }))
    .reverse(); // oldest first for chart rendering
}

// ─── Human-readable insights ─────────────────────────────────────────────────

function buildInsights(
  currentScore: number | null,
  topIssues: IssueFrequency[],
  history: HistoricalPoint[],
  pagesCrawled: number
): string[] {
  const insights: string[] = [];
  const score = currentScore ?? 0;

  // Score context
  if (score >= 80) {
    insights.push("Your site has strong SEO fundamentals. Focus on content depth and link building to push further.");
  } else if (score >= 60) {
    insights.push("Your site has a solid base but several fixable issues are holding back rankings.");
  } else if (score >= 40) {
    insights.push("Multiple critical SEO issues are likely costing you significant organic traffic.");
  } else {
    insights.push("Your site has fundamental SEO problems that need immediate attention.");
  }

  // Historical comparison
  if (history.length >= 2) {
    const prev = history[history.length - 2].score;
    const delta = score - prev;
    if (delta > 5) {
      insights.push(`Score improved by ${delta} points since your last audit — keep the momentum going.`);
    } else if (delta < -5) {
      insights.push(`Score dropped ${Math.abs(delta)} points since your last audit — check for regressions.`);
    }
  }

  // Top issue insight
  const highIssues = topIssues.filter((i) => i.severity === "high");
  if (highIssues.length > 0) {
    const top = highIssues[0];
    insights.push(`"${top.label}" is your most widespread critical issue, affecting ${top.count} page${top.count > 1 ? "s" : ""}.`);
  }

  // Coverage insight
  if (pagesCrawled < 5) {
    insights.push("Only a small number of pages were crawled. Ensure your site is publicly accessible for a full audit.");
  }

  // Quick win
  const quickWin = topIssues.find(
    (i) => i.type === "missing_meta" || i.type === "meta_too_short" || i.type === "missing_canonical"
  );
  if (quickWin) {
    insights.push(`Quick win: fixing "${quickWin.label}" on ${quickWin.count} page${quickWin.count > 1 ? "s" : ""} is low effort with measurable SERP impact.`);
  }

  return insights;
}

// ─── Optimized content items (AI title/meta suggestions with before/after) ────

function buildOptimizedContent(
  sugs: Array<{ type: string; body: string; page: { url: string; title: string | null } | null }>,
  pagesList: Array<{ url: string; title: string | null; metaDescription: string | null }>
): OptimizedContentItem[] {
  const pageMap = new Map(pagesList.map((p) => [p.url, p]));
  const items: OptimizedContentItem[] = [];

  for (const s of sugs) {
    if (!s.page) continue;
    if (s.type !== "title" && s.type !== "meta") continue;

    const page = pageMap.get(s.page.url);
    items.push({
      pageUrl: s.page.url,
      pageTitle: s.page.title,
      before: s.type === "title" ? (page?.title ?? null) : (page?.metaDescription ?? null),
      after: s.body,
      type: s.type as "title" | "meta",
    });
  }

  return items;
}

// ─── Issue severity counts ────────────────────────────────────────────────────

function buildIssueCounts(
  pagesList: Array<{ issues: PageIssueRecord[] | null; score: number }>
): { critical: number; warnings: number; passed: number } {
  let critical = 0;
  let warnings = 0;
  let passed = 0;

  const TOTAL_CHECKS_PER_PAGE = 8;

  for (const page of pagesList) {
    const issues = page.issues ?? [];
    const highCount = issues.filter((i) => i.severity === "high").length;
    const mediumCount = issues.filter((i) => i.severity === "medium").length;
    const lowCount = issues.filter((i) => i.severity === "low").length;
    critical += highCount;
    warnings += mediumCount + lowCount;
    const issueTotal = highCount + mediumCount + lowCount;
    passed += Math.max(0, TOTAL_CHECKS_PER_PAGE - issueTotal);
  }

  return { critical, warnings, passed };
}

// ─── Markdown report export ───────────────────────────────────────────────────

export function generateMarkdownReport(report: AuditReport): string {
  const { audit, site, topIssues, suggestions, scoreBreakdown, insights } = report;
  const score = audit.overallScore ?? 0;
  const date = audit.completedAt
    ? new Date(audit.completedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "In progress";

  const lines: string[] = [
    `# SEO Audit Report — ${site.name}`,
    `**Site:** ${site.url}`,
    `**Date:** ${date}`,
    `**Overall Score:** ${score}/100`,
    `**Pages Crawled:** ${audit.pagesCrawled}`,
    `**Issues Found:** ${audit.issuesFound}`,
    "",
    "---",
    "",
    "## Key Insights",
    ...insights.map((i) => `- ${i}`),
    "",
    "## Score Breakdown",
    "| Category | Score | Issues |",
    "|----------|-------|--------|",
    ...scoreBreakdown.map(
      (b) => `| ${b.category} | ${b.score}/100 | ${b.issueCount} |`
    ),
    "",
    "## Top Issues",
    "| Issue | Pages Affected | Severity |",
    "|-------|---------------|----------|",
    ...topIssues.map(
      (i) => `| ${i.label} | ${i.count} | ${i.severity.toUpperCase()} |`
    ),
    "",
    "## Recommendations",
    "",
    "### High Priority",
    ...report.suggestionsByPriority.high.map(
      (s) => `**${s.title}**\n${s.body}\n`
    ),
    "",
    "### Medium Priority",
    ...report.suggestionsByPriority.medium.map(
      (s) => `**${s.title}**\n${s.body}\n`
    ),
    "",
    "## Growth Roadmap",
    ...report.growthRecommendations.slice(0, 5).map(
      (g) =>
        `- **[${g.impact.toUpperCase()} IMPACT / ${g.effort.toUpperCase()} EFFORT]** ${g.title}: ${g.description ?? ""}`
    ),
    "",
    "---",
    `*Generated by GrowthPilot AI — ${new Date().toISOString()}*`,
  ];

  return lines.join("\n");
}
