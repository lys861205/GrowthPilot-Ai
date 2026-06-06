"use server";

import { db } from "./index";
import {
  sites,
  audits,
  pages,
  suggestions,
  blogPosts,
  growthRecommendations,
  memories,
} from "./schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

// ─── Sites ────────────────────────────────────────────────────────────────────

export async function getSitesByUserId(userId: string) {
  return db.query.sites.findMany({
    where: eq(sites.userId, userId),
    orderBy: desc(sites.createdAt),
  });
}

export async function getSiteById(id: string, userId: string) {
  return db.query.sites.findFirst({
    where: and(eq(sites.id, id), eq(sites.userId, userId)),
  });
}

export async function getSiteWithLatestAudit(id: string, userId: string) {
  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, id), eq(sites.userId, userId)),
    with: {
      audits: {
        orderBy: desc(audits.createdAt),
        limit: 1,
      },
    },
  });
  return site;
}

// ─── Audits ───────────────────────────────────────────────────────────────────

export async function getAuditById(id: string) {
  return db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: {
      site: true,
    },
  });
}

export async function getAuditWithDetails(id: string) {
  return db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: {
      site: true,
      pages: {
        orderBy: (pages, { asc }) => [asc(pages.score)],
      },
      suggestions: {
        orderBy: (s, { asc, desc }) => [asc(s.priority), desc(s.createdAt)],
      },
    },
  });
}

export async function getAuditsBySiteId(siteId: string) {
  return db.query.audits.findMany({
    where: eq(audits.siteId, siteId),
    orderBy: desc(audits.createdAt),
    limit: 10,
  });
}

export async function getLatestAuditForSite(siteId: string) {
  return db.query.audits.findFirst({
    where: and(
      eq(audits.siteId, siteId),
      eq(audits.status, "done")
    ),
    orderBy: desc(audits.completedAt),
  });
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPagesByAuditId(auditId: string) {
  return db.query.pages.findMany({
    where: eq(pages.auditId, auditId),
    orderBy: (pages, { asc }) => [asc(pages.score)],
  });
}

export async function getPageWithSuggestions(pageId: string) {
  return db.query.pages.findFirst({
    where: eq(pages.id, pageId),
    with: {
      suggestions: true,
    },
  });
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

export async function getSuggestionsByAuditId(auditId: string) {
  return db.query.suggestions.findMany({
    where: eq(suggestions.auditId, auditId),
    with: {
      page: {
        columns: { url: true, title: true },
      },
    },
    orderBy: (s, { asc }) => [asc(s.priority)],
  });
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPostsBySiteId(siteId: string) {
  return db.query.blogPosts.findMany({
    where: eq(blogPosts.siteId, siteId),
    orderBy: desc(blogPosts.createdAt),
  });
}

export async function getBlogPostById(id: string) {
  return db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
  });
}

// ─── Growth ───────────────────────────────────────────────────────────────────

export async function getGrowthRecommendationsBySiteId(siteId: string) {
  return db.query.growthRecommendations.findMany({
    where: eq(growthRecommendations.siteId, siteId),
    orderBy: [
      desc(growthRecommendations.impact),
      desc(growthRecommendations.createdAt),
    ],
  });
}

// ─── Memories ─────────────────────────────────────────────────────────────────

export async function getMemoriesBySiteId(siteId: string, limit = 5) {
  return db.query.memories.findMany({
    where: eq(memories.siteId, siteId),
    orderBy: desc(memories.createdAt),
    limit,
  });
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const userSites = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.userId, userId));

  if (userSites.length === 0) {
    return {
      totalSites: 0,
      totalAudits: 0,
      totalPosts: 0,
      totalContent: 0,
      totalIssues: 0,
      avgScore: null,
      recentAudits: [] as Array<{ id: string; overallScore: number | null; pagesCrawled: number; issuesFound: number; site: { name: string; url: string } | null }>,
    };
  }

  const siteIds = userSites.map((s) => s.id);
  const siteIdsArray = sql.raw(`ARRAY['${siteIds.join("','")}']::uuid[]`);

  const [auditStats] = await db
    .select({
      totalAudits: count(audits.id),
      avgScore: sql<number>`round(avg(${audits.overallScore}))`,
      totalIssues: sql<number>`coalesce(sum(${audits.issuesFound}), 0)`,
    })
    .from(audits)
    .where(sql`${audits.siteId} = ANY(${siteIdsArray})`);

  const [postStats] = await db
    .select({ totalPosts: count(blogPosts.id) })
    .from(blogPosts)
    .where(sql`${blogPosts.siteId} = ANY(${siteIdsArray})`);

  const recentAudits = await db.query.audits.findMany({
    where: sql`${audits.siteId} = ANY(${siteIdsArray})`,
    orderBy: desc(audits.completedAt),
    limit: 6,
    with: { site: { columns: { name: true, url: true } } },
  });

  return {
    totalSites: userSites.length,
    totalAudits: auditStats?.totalAudits ?? 0,
    totalContent: postStats?.totalPosts ?? 0,
    totalIssues: Number(auditStats?.totalIssues ?? 0),
    avgScore: auditStats?.avgScore ?? null,
    recentAudits,
  };
}
