import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { triggerAuditById } from "@/lib/audit/actions";

const bodySchema = z.object({ siteId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const result = await triggerAuditById(parsed.data.siteId);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ auditId: result.auditId }, { status: 201 });
}
