import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { requireSession } from "@/lib/auth/session";
import { buildAuditReport } from "@/lib/report/generator";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AuditReportPDF } from "@/lib/pdf/AuditReportPDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, id),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.site.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (audit.status !== "done") {
    return NextResponse.json({ error: "Audit not complete" }, { status: 400 });
  }

  const report = await buildAuditReport(id);
  if (!report) return NextResponse.json({ error: "Report unavailable" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(AuditReportPDF, { report }) as any);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="seo-report-${id.slice(0, 8)}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
