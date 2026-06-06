import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { toggleGrowthItemAction, deleteGrowthItemAction } from "@/lib/growth/actions";

const patchSchema = z.object({ done: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "done (boolean) is required" }, { status: 400 });
  }

  const result = await toggleGrowthItemAction(id, parsed.data.done);
  if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteGrowthItemAction(id);
  if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ success: true });
}
