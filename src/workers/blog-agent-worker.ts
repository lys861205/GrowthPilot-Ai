import { db } from "@/lib/db";
import { blogAgentJobs, blogIdeas, audits, pages, sites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createBlogAgentWorker, type BlogAgentJobData, type BlogAgentJobResult } from "@/lib/redis/queue";
import { runBlogAgent } from "@/lib/qwen/blog-agent";
import type { Job } from "bullmq";

async function processBlogAgent(
  job: Job<BlogAgentJobData, BlogAgentJobResult>
): Promise<BlogAgentJobResult> {
  const { jobId, siteId, auditId } = job.data;

  // Mark as running
  await db
    .update(blogAgentJobs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(blogAgentJobs.id, jobId));

  try {
    const site = await db.query.sites.findFirst({ where: eq(sites.id, siteId) });
    if (!site) throw new Error("Site not found");

    // Resolve audit data
    let auditScore = 70;
    let pagesCrawled = 0;
    let topIssues: Array<{ label: string; count: number; severity: string }> = [];
    let pageTitles: string[] = [];
    let pageUrls: string[] = [];
    let resolvedAuditId = auditId;

    const LABELS: Record<string, string> = {
      thin_content: "Thin content",
      low_word_count: "Low word count",
      missing_title: "Missing title tag",
      missing_meta: "Missing meta description",
      missing_h1: "Missing H1",
      images_missing_alt: "Images missing alt text",
      missing_canonical: "Missing canonical tag",
      no_internal_links: "No internal links",
    };

    const targetAuditId = auditId ?? (await db.query.audits.findFirst({
      where: and(eq(audits.siteId, siteId), eq(audits.status, "done")),
      orderBy: desc(audits.createdAt),
    }))?.id;

    if (targetAuditId) {
      resolvedAuditId = targetAuditId;
      const audit = await db.query.audits.findFirst({ where: eq(audits.id, targetAuditId) });
      if (audit) {
        auditScore = audit.overallScore ?? 70;
        pagesCrawled = audit.pagesCrawled;
      }

      const auditPages = await db.query.pages.findMany({
        where: eq(pages.auditId, targetAuditId),
        columns: { title: true, url: true, issues: true },
      });

      pageTitles = auditPages.map((p) => p.title ?? "").filter(Boolean);
      pageUrls = auditPages.map((p) => p.url);

      const counts: Record<string, { count: number; severity: string; label: string }> = {};
      for (const page of auditPages) {
        for (const issue of page.issues ?? []) {
          if (!counts[issue.type]) {
            counts[issue.type] = { count: 0, severity: issue.severity, label: LABELS[issue.type] ?? issue.type };
          }
          counts[issue.type].count++;
        }
      }
      topIssues = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
    }

    // Run the 3-call AI agent
    const result = await runBlogAgent({
      siteUrl: site.url,
      siteName: site.name,
      auditScore,
      pagesCrawled,
      topIssues,
      pageTitles,
      pageUrls,
    });

    // Clear old ideas for this site+audit, insert fresh ones
    if (resolvedAuditId) {
      await db.delete(blogIdeas).where(
        and(eq(blogIdeas.siteId, siteId), eq(blogIdeas.auditId, resolvedAuditId))
      );
    }

    if (result.ideas.length > 0) {
      await db.insert(blogIdeas).values(
        result.ideas.map((idea) => ({
          siteId,
          auditId: resolvedAuditId ?? null,
          topic: idea.topic,
          primaryKeyword: idea.primaryKeyword,
          secondaryKeywords: idea.secondaryKeywords,
          intent: idea.intent,
          priority: idea.priority,
          priorityReason: idea.priorityReason,
          titles: idea.titles,
          recommendedTitle: idea.recommendedTitle,
          outline: idea.outline,
          estimatedWordCount: idea.estimatedWordCount,
          faq: idea.faq,
          metaTitle: idea.metaTitle,
          metaDescription: idea.metaDescription,
          internalLinks: idea.internalLinks,
        }))
      );
    }

    await db
      .update(blogAgentJobs)
      .set({
        status: "done",
        ideasGenerated: result.ideas.length,
        completedAt: new Date(),
      })
      .where(eq(blogAgentJobs.id, jobId));

    return { jobId, ideasGenerated: result.ideas.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[blog-agent] Job ${jobId} failed:`, message);

    await db
      .update(blogAgentJobs)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(blogAgentJobs.id, jobId));

    throw err;
  }
}

const worker = createBlogAgentWorker(processBlogAgent);

worker.on("completed", (job) => {
  console.log(`[blog-agent] Job ${job.id} completed — ${job.returnvalue.ideasGenerated} ideas`);
});

worker.on("failed", (job, err) => {
  console.error(`[blog-agent] Job ${job?.id} failed:`, err.message);
});

console.log("[blog-agent] Worker started");
