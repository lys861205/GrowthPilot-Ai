"use server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { gscAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function disconnectGoogle() {
  const session = await requireSession();
  await db.delete(gscAccounts).where(eq(gscAccounts.userId, session.user.id));
  revalidatePath("/dashboard/settings");
}
