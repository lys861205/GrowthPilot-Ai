"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audits, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auditQueue } from "@/lib/redis/queue";
import { requireSession } from "@/lib/auth/session";

const triggerAuditSchema = z.object({
  siteId: z.string().uuid("Invalid site ID"),
});

export type AuditActionResult =
  | { success: true; auditId: string }
  | { success: false; error: string };

async function runTriggerAudit(siteId: string): Promise<AuditActionResult> {
  const session = await requireSession();
  const userId = session.user.id;

  const parsed = triggerAuditSchema.safeParse({ siteId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, userId)),
  });

  if (!site) {
    return { success: false, error: "Site not found" };
  }

  const runningAudit = await db.query.audits.findFirst({
    where: and(eq(audits.siteId, siteId), eq(audits.status, "running")),
  });

  if (runningAudit) {
    return { success: false, error: "An audit is already running for this site" };
  }

  const [audit] = await db
    .insert(audits)
    .values({ siteId, status: "pending" })
    .returning({ id: audits.id });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (auditQueue as any).add(
    "audit",
    { auditId: audit.id, siteId, siteUrl: site.url, userId },
    { jobId: audit.id }
  );

  return { success: true, auditId: audit.id };
}

// FormData signature for useActionState
export async function triggerAuditAction(
  _prev: AuditActionResult | null,
  formData: FormData
): Promise<AuditActionResult> {
  return runTriggerAudit(formData.get("siteId") as string);
}

// Direct call signature for programmatic use
export async function triggerAuditById(siteId: string): Promise<AuditActionResult> {
  return runTriggerAudit(siteId);
}

export async function getAuditStatusAction(
  auditId: string
): Promise<{ status: string; overallScore: number | null } | null> {
  const session = await requireSession();

  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit || audit.site.userId !== session.user.id) return null;

  return { status: audit.status, overallScore: audit.overallScore };
}
