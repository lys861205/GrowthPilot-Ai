import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSitesByUserId } from "@/lib/db/queries";

export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userSites = await getSitesByUserId(session.user.id);
  return Response.json(userSites);
}
