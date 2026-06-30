"use server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { pushScoreHistory, setAuditSnapshot, refreshUserContext } from "@/lib/redis/memory";

export async function injectDemoDataAction() {
  const session = await requireSession();
  const userId = session.user.id;

  // 1. Create fake GSC Account
  const [gscAccount] = await db.insert(schema.gscAccounts).values({
    userId,
    email: "judge.demo@growthpilot.ai",
    accessToken: "fake-access-token",
    refreshToken: "fake-refresh-token",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
  }).returning();

  // 2. Create demo site
  const [site] = await db.insert(schema.sites).values({
    userId,
    url: "https://demo-store.myshopify.com",
    name: "Demo Store",
    platform: "shopify",
  }).returning();

  // 3. Create fake GSC Property
  const [gscProperty] = await db.insert(schema.gscProperties).values({
    siteId: site.id,
    gscAccountId: gscAccount.id,
    propertyUrl: "sc-domain:demo-store.myshopify.com"
  }).returning();

  // 4. Create fake GSC Daily Metrics for the last 30 days
  const metrics = [];
  const queries = [
    { query: "demo store", position: 2.1, imp: 1200, clicks: 450 },
    { query: "buy demo products", position: 5.4, imp: 800, clicks: 120 },
    // Striking Distance keywords (page 2-4, high imp, low ctr)
    { query: "shopify demo store examples", position: 12.5, imp: 3400, clicks: 12 },
    { query: "best demo store themes", position: 15.2, imp: 2100, clicks: 8 },
    { query: "ecommerce demo template", position: 22.1, imp: 4500, clicks: 5 },
    { query: "demo store case study", position: 11.5, imp: 1800, clicks: 15 },
    { query: "fake products online", position: 31.0, imp: 5000, clicks: 2 }
  ];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    for (const q of queries) {
      metrics.push({
        propertyId: gscProperty.id,
        date,
        query: q.query,
        impressions: Math.floor(q.imp / 30) + Math.floor(Math.random() * 10),
        clicks: Math.floor(q.clicks / 30) + Math.floor(Math.random() * 3),
        position: q.position + (Math.random() - 0.5),
        ctr: q.clicks / q.imp
      });
    }
  }

  await db.insert(schema.gscDailyMetrics).values(metrics);

  // 5. Create a completed demo audit
  const [audit] = await db.insert(schema.audits).values({
    siteId: site.id,
    status: "done",
    overallScore: 62,
    pagesCrawled: 5,
    issuesFound: 12,
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
    completedAt: new Date(),
  }).returning();

  // 6. Create demo pages
  const demoPages = [
    {
      url: "https://demo-store.myshopify.com/",
      title: "Demo Store - Home",
      metaDescription: "Welcome to our store",
      h1Count: 1,
      h2Count: 3,
      wordCount: 450,
      score: 72,
      issues: [
        {
          type: "meta_length",
          severity: "medium" as const,
          message: "Meta description is too short (< 120 chars)",
          detail: "Current: 22 chars. Recommended: 120-160 chars.",
        },
      ],
    },
    {
      url: "https://demo-store.myshopify.com/collections/all",
      title: null,
      metaDescription: null,
      h1Count: 0,
      h2Count: 1,
      wordCount: 120,
      score: 28,
      issues: [
        { type: "missing_title", severity: "high" as const, message: "Page is missing a title tag" },
        { type: "missing_h1", severity: "high" as const, message: "Page has no H1 heading" },
        { type: "missing_meta", severity: "medium" as const, message: "Page is missing a meta description" },
      ],
    },
  ];

  const insertedPages = await db.insert(schema.pages).values(
    demoPages.map((p) => ({ ...p, auditId: audit.id }))
  ).returning();

  // 7. Create demo suggestions
  await db.insert(schema.suggestions).values([
    {
      auditId: audit.id,
      pageId: insertedPages[1].id,
      type: "title",
      priority: "high",
      title: "Add a title tag to your Collections page",
      body: 'Your Collections page is missing a title tag. Add: "Shop All Products | Demo Store" to improve click-through rates from search results.',
    },
    {
      auditId: audit.id,
      pageId: insertedPages[1].id,
      type: "structure",
      priority: "high",
      title: "Add an H1 heading to Collections page",
      body: 'Search engines use H1 tags to understand page content. Add a clear H1 like "Browse All Products" near the top of the page.',
    },
    {
      auditId: audit.id,
      pageId: insertedPages[0].id,
      type: "meta",
      priority: "medium",
      title: "Expand your homepage meta description",
      body: 'Extend your meta description to 120-160 characters. Try: "Shop our curated collection of premium accessories. Free shipping on orders over $50. New arrivals added weekly."',
    },
  ]);

  // 8. Create demo growth recommendations
  await db.insert(schema.growthRecommendations).values([
    {
      siteId: site.id,
      auditId: audit.id,
      category: "seo",
      title: "Fix missing title tags on 3 pages",
      description: "Three key pages are missing title tags, costing you valuable search impressions.",
      impact: "high",
      effort: "low",
    },
    {
      siteId: site.id,
      auditId: audit.id,
      category: "content",
      title: "Publish 2 SEO blog posts per week",
      description: "Your site has zero blog content. Regular posts targeting product keywords drive 3x more organic traffic.",
      impact: "high",
      effort: "medium",
    },
  ]);

  // 9. Push to Redis Memory
  const topIssues = [
    { type: "missing_title", label: "Missing Title Tag", count: 1, severity: "high" },
    { type: "missing_h1", label: "Missing H1 Heading", count: 1, severity: "high" },
    { type: "meta_length", label: "Meta Description Too Short", count: 1, severity: "medium" }
  ];
  const completedAt = audit.completedAt!.toISOString();
  
  await pushScoreHistory(site.id, {
    auditId: audit.id,
    score: 62,
    pagesCrawled: 5,
    issuesFound: 12,
    completedAt,
  });

  await setAuditSnapshot({
    auditId: audit.id,
    siteId: site.id,
    siteName: site.name,
    siteUrl: site.url,
    overallScore: 62,
    pagesCrawled: 5,
    issuesFound: 12,
    completedAt,
    topIssues,
    scoreBreakdown: { "90-100": 0, "70-89": 1, "50-69": 0, "0-49": 1 },
  });

  await refreshUserContext(userId, site.id, audit.id, 62, "missing_title");

  revalidatePath("/dashboard/sites");
  return { success: true };
}
