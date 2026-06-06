import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveBlogContentAction, updatePostStatusAction, deleteBlogPostAction } from "@/lib/content/actions";

const patchSchema = z.object({
  content: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const post = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    with: { site: { columns: { userId: true } } },
  });

  if (!post || post.site.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(post);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.content !== undefined) {
    const result = await saveBlogContentAction(id, parsed.data.content);
    if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  }

  if (parsed.data.status !== undefined) {
    const result = await updatePostStatusAction(id, parsed.data.status);
    if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteBlogPostAction(id);
  if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ success: true });
}
