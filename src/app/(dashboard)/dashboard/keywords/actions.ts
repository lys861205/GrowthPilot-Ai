"use server";

import { requireSession } from "@/lib/auth/session";
import { gscSyncQueue } from "@/lib/redis/queue";

export async function syncGscDataAction(accountId: string) {
  await requireSession();
  
  await gscSyncQueue.add("sync", { accountId });
  return { success: true };
}
