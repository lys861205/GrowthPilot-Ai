import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getBlogPostsBySiteId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const siteId = request.nextUrl.searchParams.get("siteId");
  if (!siteId) return Response.json({ error: "siteId required" }, { status: 400 });

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
    columns: { id: true },
  });

  if (!site) return Response.json({ error: "Site not found" }, { status: 404 });

  const posts = await getBlogPostsBySiteId(siteId);
  return Response.json(posts);
}
