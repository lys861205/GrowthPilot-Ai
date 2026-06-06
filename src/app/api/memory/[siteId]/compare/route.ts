import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compareAudits } from "@/lib/redis/memory";

export async function GET(
  req: NextRequest,
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

  const { searchParams } = new URL(req.url);
  const auditA = searchParams.get("a");
  const auditB = searchParams.get("b");

  if (!auditA || !auditB) {
    return NextResponse.json(
      { error: "Query params ?a=<auditId>&b=<auditId> required" },
      { status: 400 }
    );
  }

  try {
    const result = await compareAudits(auditA, auditB, siteId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comparison failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
