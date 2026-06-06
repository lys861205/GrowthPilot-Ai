"use server";

import { db } from "@/lib/db";
import { growthRecommendations, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";

export async function toggleGrowthItemAction(
  recommendationId: string,
  done: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const rec = await db.query.growthRecommendations.findFirst({
    where: eq(growthRecommendations.id, recommendationId),
    with: { site: { columns: { userId: true } } },
  });

  if (!rec || rec.site.userId !== session.user.id) {
    return { success: false, error: "Recommendation not found" };
  }

  await db
    .update(growthRecommendations)
    .set({ done })
    .where(eq(growthRecommendations.id, recommendationId));

  return { success: true };
}

export async function deleteGrowthItemAction(
  recommendationId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireSession();

  const rec = await db.query.growthRecommendations.findFirst({
    where: eq(growthRecommendations.id, recommendationId),
    with: { site: { columns: { userId: true } } },
  });

  if (!rec || rec.site.userId !== session.user.id) {
    return { success: false, error: "Recommendation not found" };
  }

  await db
    .delete(growthRecommendations)
    .where(eq(growthRecommendations.id, recommendationId));

  return { success: true };
}
