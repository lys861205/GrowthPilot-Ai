import { redis } from "@/lib/redis";
import { K, TTL, type UserContext } from "./keys";

// ─── Write ────────────────────────────────────────────────────────────────────

export async function updateUserContext(
  userId: string,
  siteId: string,
  patch: Partial<UserContext>
): Promise<void> {
  const key = K.userContext(userId, siteId);
  if (Object.keys(patch).length === 0) return;

  await redis
    .multi()
    .hset(key, patch as Record<string, string>)
    .expire(key, TTL.USER_CONTEXT)
    .exec();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserContext(
  userId: string,
  siteId: string
): Promise<UserContext | null> {
  const key = K.userContext(userId, siteId);
  const data = await redis.hgetall(key);
  if (!data || !data.lastAuditId) return null;
  return data as unknown as UserContext;
}

// ─── Computed fields (called after each audit completes) ─────────────────────

export async function refreshUserContext(
  userId: string,
  siteId: string,
  latestAuditId: string,
  latestScore: number,
  topIssueType: string
): Promise<void> {
  const key = K.userContext(userId, siteId);
  const existing = await redis.hgetall(key);

  const prevBest  = Number(existing?.bestScore  ?? 0);
  const prevWorst = Number(existing?.worstScore ?? 999);
  const totalAudits = Number(existing?.totalAudits ?? 0) + 1;

  // Rolling avg score change (simple: new_score - last_score)
  const lastScore = Number(existing?.lastAuditScore ?? latestScore);
  const thisDelta = latestScore - lastScore;
  const prevAvg   = parseFloat(existing?.avgScoreChange ?? "0");
  const newAvg    = totalAudits === 1
    ? 0
    : parseFloat(((prevAvg * (totalAudits - 2) + thisDelta) / (totalAudits - 1)).toFixed(1));

  const patch: Partial<UserContext> = {
    lastAuditId:        latestAuditId,
    lastAuditScore:     String(latestScore),
    bestScore:          String(Math.max(prevBest, latestScore)),
    worstScore:         String(Math.min(prevWorst === 999 ? latestScore : prevWorst, latestScore)),
    totalAudits:        String(totalAudits),
    avgScoreChange:     String(newAvg),
    topPersistentIssue: topIssueType,
  };

  await updateUserContext(userId, siteId, patch);
}

export async function updateBlogStats(
  userId: string,
  siteId: string
): Promise<void> {
  const key = K.userContext(userId, siteId);
  const existing = await redis.hgetall(key);
  const total = Number(existing?.totalBlogPosts ?? 0) + 1;

  await updateUserContext(userId, siteId, {
    totalBlogPosts: String(total),
    lastBlogGenAt:  new Date().toISOString(),
  });
}
