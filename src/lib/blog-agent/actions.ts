"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { blogIdeas, blogAgentJobs, sites, blogPosts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { blogAgentQueue } from "@/lib/redis/queue";
import { redirect } from "next/navigation";
import { upsertBlogEntry } from "@/lib/redis/memory";

// ─── Trigger Blog Agent (enqueue background job) ──────────────────────────────

const triggerSchema = z.object({
  siteId: z.string().uuid("Invalid site ID"),
  auditId: z.string().uuid("Invalid audit ID").optional(),
});

export type TriggerBlogAgentResult =
  | { success: true; jobId: string }
  | { success: false; error: string };

export async function triggerBlogAgentAction(
  _prev: TriggerBlogAgentResult | null,
  formData: FormData
): Promise<TriggerBlogAgentResult> {
  const session = await requireSession();

  const parsed = triggerSchema.safeParse({
    siteId: formData.get("siteId"),
    auditId: formData.get("auditId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { siteId, auditId } = parsed.data;

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) return { success: false, error: "Site not found" };

  // Create a job record in DB
  const [jobRecord] = await db
    .insert(blogAgentJobs)
    .values({ siteId, auditId: auditId ?? null, status: "pending" })
    .returning({ id: blogAgentJobs.id });

  // Enqueue BullMQ job — returns immediately
  await blogAgentQueue.add("generate-blog-ideas", {
    jobId: jobRecord.id,
    siteId,
    auditId: auditId ?? null,
    userId: session.user.id,
  });

  redirect(`/dashboard/blog-agent?siteId=${siteId}&jobId=${jobRecord.id}`);
}

// ─── Convert Idea → Blog Post ─────────────────────────────────────────────────

export async function convertIdeaToPostAction(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const idea = await db.query.blogIdeas.findFirst({
    where: eq(blogIdeas.id, ideaId),
    with: { site: { columns: { userId: true, id: true, url: true, name: true } } },
  });

  if (!idea || idea.site.userId !== session.user.id) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.convertedToPostId) {
    redirect(`/dashboard/content/${idea.convertedToPostId}`);
  }

  const slugBase = (idea.recommendedTitle ?? idea.topic)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const [post] = await db
    .insert(blogPosts)
    .values({
      siteId: idea.site.id,
      title: idea.recommendedTitle ?? idea.topic,
      slug: slugBase,
      excerpt: idea.metaDescription ?? "",
      keywords: [idea.primaryKeyword, ...(idea.secondaryKeywords ?? [])].slice(0, 10),
      status: "draft",
      content: null,
    })
    .returning({ id: blogPosts.id });

  await db
    .update(blogIdeas)
    .set({ convertedToPostId: post.id })
    .where(eq(blogIdeas.id, ideaId));

  // Index in Redis so compare/blog timeline stays current
  await upsertBlogEntry(idea.site.id, {
    postId:         post.id,
    title:          idea.recommendedTitle ?? idea.topic,
    slug:           slugBase,
    primaryKeyword: idea.primaryKeyword,
    seoScore:       null,
    wordCount:      null,
    status:         "draft",
    auditId:        idea.auditId,
    createdAt:      new Date().toISOString(),
  }).catch(console.error);

  redirect(`/dashboard/content/${post.id}`);
}

// ─── Poll job status ──────────────────────────────────────────────────────────

export async function pollBlogAgentJobAction(jobId: string) {
  const session = await requireSession();

  const job = await db.query.blogAgentJobs.findFirst({
    where: eq(blogAgentJobs.id, jobId),
    with: { site: { columns: { userId: true } } },
  });

  if (!job || job.site.userId !== session.user.id) {
    return { success: false as const, error: "Job not found" };
  }

  return {
    success: true as const,
    status: job.status,
    ideasGenerated: job.ideasGenerated,
    errorMessage: job.errorMessage,
  };
}

// ─── Get Blog Ideas ───────────────────────────────────────────────────────────

export async function getBlogIdeasAction(siteId: string) {
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) return { success: false as const, error: "Site not found" };

  const ideas = await db.query.blogIdeas.findMany({
    where: eq(blogIdeas.siteId, siteId),
    orderBy: [desc(blogIdeas.createdAt)],
  });

  return { success: true as const, ideas, site };
}
