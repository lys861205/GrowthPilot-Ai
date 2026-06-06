import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuditWithDetails } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const audit = await getAuditWithDetails(id);
  if (!audit) return Response.json({ error: "Not found" }, { status: 404 });
  if (audit.site.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(audit);
}
