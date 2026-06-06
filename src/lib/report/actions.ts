"use server";

import { requireSession } from "@/lib/auth/session";
import { buildAuditReport, generateMarkdownReport } from "./generator";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getAuditReportAction(auditId: string) {
  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit) return { success: false as const, error: "Audit not found" };
  if (audit.site.userId !== session.user.id) {
    return { success: false as const, error: "Forbidden" };
  }

  const report = await buildAuditReport(auditId);
  if (!report) return { success: false as const, error: "Report unavailable" };

  return { success: true as const, report };
}

export async function exportReportMarkdownAction(
  auditId: string
): Promise<{ success: boolean; markdown?: string; error?: string }> {
  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit || audit.site.userId !== session.user.id) {
    return { success: false, error: "Not found" };
  }

  const report = await buildAuditReport(auditId);
  if (!report) return { success: false, error: "Report unavailable" };

  const markdown = generateMarkdownReport(report);
  return { success: true, markdown };
}
