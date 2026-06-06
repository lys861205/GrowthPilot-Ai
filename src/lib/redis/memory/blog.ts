import { redis } from "@/lib/redis";
import { K, TTL, type BlogIndexEntry } from "./keys";

// ─── Write ────────────────────────────────────────────────────────────────────

export async function upsertBlogEntry(
  siteId: string,
  entry: BlogIndexEntry
): Promise<void> {
  const key = K.blogIndex(siteId);
  await redis
    .multi()
    .hset(key, entry.postId, JSON.stringify(entry))
    .expire(key, TTL.BLOG_INDEX)
    .exec();
}

export async function removeBlogEntry(
  siteId: string,
  postId: string
): Promise<void> {
  await redis.hdel(K.blogIndex(siteId), postId);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getBlogIndex(siteId: string): Promise<BlogIndexEntry[]> {
  const key = K.blogIndex(siteId);
  const raw = await redis.hgetall(key);
  if (!raw) return [];
  return Object.values(raw)
    .map((v) => JSON.parse(v) as BlogIndexEntry)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBlogEntry(
  siteId: string,
  postId: string
): Promise<BlogIndexEntry | null> {
  const raw = await redis.hget(K.blogIndex(siteId), postId);
  return raw ? (JSON.parse(raw) as BlogIndexEntry) : null;
}

// Returns posts created between two dates (for audit comparison)
export async function getBlogsBetween(
  siteId: string,
  from: Date,
  to: Date
): Promise<BlogIndexEntry[]> {
  const all = await getBlogIndex(siteId);
  return all.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}

// ─── Seed from PostgreSQL ─────────────────────────────────────────────────────

import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function warmBlogIndex(siteId: string): Promise<void> {
  const posts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.siteId, siteId),
    columns: {
      id: true,
      title: true,
      slug: true,
      keywords: true,
      seoScore: true,
      wordCount: true,
      status: true,
      createdAt: true,
    },
  });

  if (posts.length === 0) return;

  const key = K.blogIndex(siteId);
  const pipeline = redis.pipeline();
  for (const post of posts) {
    const entry: BlogIndexEntry = {
      postId:         post.id,
      title:          post.title,
      slug:           post.slug,
      primaryKeyword: (post.keywords as string[] | null)?.[0] ?? "",
      seoScore:       post.seoScore,
      wordCount:      post.wordCount,
      status:         post.status,
      auditId:        null,
      createdAt:      post.createdAt.toISOString(),
    };
    pipeline.hset(key, post.id, JSON.stringify(entry));
  }
  pipeline.expire(key, TTL.BLOG_INDEX);
  await pipeline.exec();
}
