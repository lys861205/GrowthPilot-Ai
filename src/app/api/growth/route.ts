import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getGrowthRecommendationsBySiteId } from "@/lib/db/queries";

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

  if (!site) return Response.json({ error: "Not found" }, { status: 404 });

  const recs = await getGrowthRecommendationsBySiteId(siteId);
  return Response.json(recs);
}
