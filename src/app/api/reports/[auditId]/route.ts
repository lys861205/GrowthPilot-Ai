import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { buildAuditReport, generateMarkdownReport } from "@/lib/report/generator";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });
  if (audit.site.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format");

  const report = await buildAuditReport(auditId);
  if (!report) return Response.json({ error: "Report unavailable" }, { status: 404 });

  if (format === "markdown") {
    const markdown = generateMarkdownReport(report);
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-report-${auditId.slice(0, 8)}.md"`,
      },
    });
  }

  return Response.json(report);
}
