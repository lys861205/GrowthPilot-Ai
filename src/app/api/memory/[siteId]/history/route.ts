import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getScoreHistoryAsc, warmAuditSnapshot } from "@/lib/redis/memory";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    columns: { id: true, userId: true },
  });

  if (!site || site.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await getScoreHistoryAsc(siteId, 20);

  // Warm any snapshots that aren't in Redis yet
  const missing = history.filter((p) => !p.auditId);
  await Promise.allSettled(missing.map((p) => warmAuditSnapshot(p.auditId)));

  return NextResponse.json({ history });
}
