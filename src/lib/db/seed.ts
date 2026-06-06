import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a demo user (password handled by better-auth separately)
  const [user] = await db
    .insert(schema.users)
    .values({
      id: "demo_user_001",
      name: "Demo User",
      email: "demo@growthpilot.ai",
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("User already exists, skipping seed.");
    await pool.end();
    return;
  }

  // Create demo site
  const [site] = await db
    .insert(schema.sites)
    .values({
      userId: user.id,
      url: "https://demo-store.myshopify.com",
      name: "Demo Store",
      platform: "shopify",
    })
    .returning();

  // Create a completed demo audit
  const [audit] = await db
    .insert(schema.audits)
    .values({
      siteId: site.id,
      status: "done",
      overallScore: 62,
      pagesCrawled: 5,
      issuesFound: 12,
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      completedAt: new Date(),
    })
    .returning();

  // Create demo pages
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
        {
          type: "missing_title",
          severity: "high" as const,
          message: "Page is missing a title tag",
        },
        {
          type: "missing_h1",
          severity: "high" as const,
          message: "Page has no H1 heading",
        },
        {
          type: "missing_meta",
          severity: "medium" as const,
          message: "Page is missing a meta description",
        },
      ],
    },
  ];

  const insertedPages = await db
    .insert(schema.pages)
    .values(demoPages.map((p) => ({ ...p, auditId: audit.id })))
    .returning();

  // Create demo suggestions
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

  // Create demo growth recommendations
  await db.insert(schema.growthRecommendations).values([
    {
      siteId: site.id,
      auditId: audit.id,
      category: "seo",
      title: "Fix missing title tags on 3 pages",
      description:
        "Three key pages are missing title tags, costing you valuable search impressions.",
      impact: "high",
      effort: "low",
    },
    {
      siteId: site.id,
      auditId: audit.id,
      category: "content",
      title: "Publish 2 SEO blog posts per week",
      description:
        "Your site has zero blog content. Regular posts targeting product keywords drive 3x more organic traffic.",
      impact: "high",
      effort: "medium",
    },
    {
      siteId: site.id,
      auditId: audit.id,
      category: "technical",
      title: "Compress images to improve load speed",
      description:
        "Several product images exceed 500KB. Compressing them could reduce load time by 40%.",
      impact: "medium",
      effort: "low",
    },
  ]);

  // Create demo memory
  await db.insert(schema.memories).values({
    siteId: site.id,
    auditId: audit.id,
    type: "audit_summary",
    content: {
      overallScore: 62,
      pagesCrawled: 5,
      issuesFound: 12,
      topIssues: ["missing_title", "missing_h1", "meta_length"],
      summary:
        "Initial audit. Multiple pages missing critical SEO elements. Collections page needs immediate attention.",
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   User: ${user.email}`);
  console.log(`   Site: ${site.name} (${site.url})`);
  console.log(`   Audit ID: ${audit.id}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
