import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blogPosts, blogIdeas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { streamBlogPost } from "@/lib/qwen/content";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  postId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, parsed.data.postId),
    with: { site: { columns: { userId: true, url: true, companyInfo: true } } },
  });

  if (!post || post.site.userId !== session.user.id) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const keywords = post.keywords ?? [];
  const tone: "professional" | "conversational" | "educational" = "professional";

  const idea = await db.query.blogIdeas.findFirst({
    where: eq(blogIdeas.convertedToPostId, post.id),
  });

  const dbSections = idea?.outline?.sections ?? [];
  const mappedSections = dbSections.map((sec: any) => ({
    heading: sec.h2 || sec.heading || "Section",
    keyPoints: sec.subsections ? sec.subsections.map((sub: any) => sub.h3) : sec.keyPoints || [],
  }));

  const outline = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    metaDescription: post.excerpt ?? "",
    primaryKeyword: keywords[0] ?? post.title,
    secondaryKeywords: keywords.slice(1),
    sections: mappedSections,
  };

  const result = await streamBlogPost(outline, {
    topic: post.title,
    keywords,
    tone,
    wordCount: 900 as 600 | 900 | 1200,
    siteUrl: post.site.url,
    companyInfo: post.site.companyInfo,
  });

  return result.toTextStreamResponse();
}
