"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { blogPosts, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { generateBlogOutline, scoreBlogPost, extractWordCount } from "@/lib/qwen/content";
import { upsertBlogEntry } from "@/lib/redis/memory";

const generateSchema = z.object({
  siteId: z.string().uuid("Invalid site ID"),
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200),
  keywords: z.string().optional(),
  tone: z.enum(["professional", "conversational", "educational"]).default("professional"),
  wordCount: z.coerce
    .number()
    .refine((n) => [600, 900, 1200].includes(n), "Invalid word count")
    .transform((n) => n as 600 | 900 | 1200)
    .default(900),
});

export type ContentActionResult =
  | { success: true; postId: string; slug: string }
  | { success: false; error: string };

export async function generateBlogPostAction(
  _prev: ContentActionResult | null,
  formData: FormData
): Promise<ContentActionResult> {
  const session = await requireSession();

  const raw = {
    siteId: formData.get("siteId"),
    topic: formData.get("topic"),
    keywords: formData.get("keywords") ?? "",
    tone: formData.get("tone") ?? "professional",
    wordCount: formData.get("wordCount") ?? "900",
  };

  const parsed = generateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const site = await db.query.sites.findFirst({
    where: and(
      eq(sites.id, parsed.data.siteId),
      eq(sites.userId, session.user.id)
    ),
  });

  if (!site) return { success: false, error: "Site not found" };

  const keywordList = parsed.data.keywords
    ? parsed.data.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  try {
    const outline = await generateBlogOutline({
      topic: parsed.data.topic,
      keywords: keywordList,
      tone: parsed.data.tone,
      wordCount: parsed.data.wordCount,
      siteUrl: site.url,
      siteName: site.name,
    });

    // Insert a draft post with the outline data — content will be streamed
    // from the client via /api/content/stream once this action returns the postId
    const [post] = await db
      .insert(blogPosts)
      .values({
        siteId: site.id,
        title: outline.title,
        slug: outline.slug,
        excerpt: outline.excerpt,
        keywords: [...keywordList, ...outline.secondaryKeywords].slice(0, 10),
        status: "draft",
        content: null,
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug });

    await upsertBlogEntry(site.id, {
      postId:         post.id,
      title:          outline.title,
      slug:           post.slug,
      primaryKeyword: keywordList[0] ?? "",
      seoScore:       null,
      wordCount:      null,
      status:         "draft",
      auditId:        null,
      createdAt:      new Date().toISOString(),
    }).catch(console.error);

    redirect(`/dashboard/content/${post.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return { success: false, error: message };
  }
}

export async function saveBlogContentAction(
  postId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
    with: { site: { columns: { userId: true, id: true } } },
  });

  if (!post || post.site.userId !== session.user.id) {
    return { success: false, error: "Post not found" };
  }

  const wordCount = extractWordCount(content);
  const seoScore = scoreBlogPost(content, post.keywords ?? []);

  await db
    .update(blogPosts)
    .set({ content, wordCount, seoScore, updatedAt: new Date() })
    .where(eq(blogPosts.id, postId));

  await upsertBlogEntry(post.site.id as string, {
    postId,
    title:          post.title,
    slug:           post.slug,
    primaryKeyword: (post.keywords as string[] | null)?.[0] ?? "",
    seoScore,
    wordCount,
    status:         post.status as "draft" | "published",
    auditId:        null,
    createdAt:      post.createdAt?.toISOString() ?? new Date().toISOString(),
  }).catch(console.error);

  return { success: true };
}

export async function updatePostStatusAction(
  postId: string,
  status: "draft" | "published"
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
    with: { site: { columns: { userId: true } } },
  });

  if (!post || post.site.userId !== session.user.id) {
    return { success: false, error: "Post not found" };
  }

  await db
    .update(blogPosts)
    .set({ status, updatedAt: new Date() })
    .where(eq(blogPosts.id, postId));

  return { success: true };
}

export async function deleteBlogPostAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
    with: { site: { columns: { userId: true } } },
  });

  if (!post || post.site.userId !== session.user.id) {
    return { success: false, error: "Post not found" };
  }

  await db.delete(blogPosts).where(eq(blogPosts.id, postId));
  return { success: true };
}
