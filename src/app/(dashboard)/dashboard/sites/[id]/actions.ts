"use server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCompanyInfoAction(
  siteId: string,
  prevState: any,
  formData: FormData
) {
  const session = await requireSession();
  const companyInfo = formData.get("companyInfo")?.toString() ?? "";

  try {
    await db
      .update(sites)
      .set({ companyInfo })
      .where(and(eq(sites.id, siteId), eq(sites.userId, session.user.id)));

    revalidatePath(`/dashboard/sites/${siteId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update company info:", error);
    return { success: false, error: "Failed to update company info" };
  }
}
