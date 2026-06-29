import { db } from "@/lib/db";
import { gscAccounts, gscProperties, gscDailyMetrics, sites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createGscSyncWorker, type GscSyncJobData, type GscSyncJobResult } from "@/lib/redis/queue";
import type { Job } from "bullmq";

async function refreshGoogleToken(account: any) {
  if (account.expiresAt && new Date() < new Date(account.expiresAt.getTime() - 5 * 60000)) {
    return account.accessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) throw new Error("Missing Google credentials");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error("Failed to refresh token");

  await db.update(gscAccounts).set({
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }).where(eq(gscAccounts.id, account.id));

  return data.access_token;
}

async function processGscSync(
  job: Job<GscSyncJobData, GscSyncJobResult>
): Promise<GscSyncJobResult> {
  const { accountId } = job.data;

  const accounts = await db.select().from(gscAccounts).where(eq(gscAccounts.id, accountId));
  const account = accounts[0];

  if (!account) throw new Error(`Account not found: ${accountId}`);

  const token = await refreshGoogleToken(account);

  // 1. Fetch properties
  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!sitesRes.ok) throw new Error(`Failed to fetch sites: ${await sitesRes.text()}`);
  
  const sitesData = await sitesRes.json();
  const siteEntries = sitesData.siteEntry || [];

  for (const entry of siteEntries) {
    // Check if property exists
    let propertyRecord = await db.query.gscProperties.findFirst({
      where: and(
        eq(gscProperties.gscAccountId, account.id),
        eq(gscProperties.propertyUrl, entry.siteUrl)
      )
    });

    if (!propertyRecord) {
      // Find matching internal site
      const internalSite = await db.query.sites.findFirst({
        where: eq(sites.userId, account.userId)
      });
      
      if (!internalSite) continue;

      const [inserted] = await db.insert(gscProperties).values({
        siteId: internalSite.id,
        gscAccountId: account.id,
        propertyUrl: entry.siteUrl
      }).returning();
      
      propertyRecord = inserted;
    }

    // 2. Fetch metrics for the last 30 days
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const metricsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(entry.siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query']
      })
    });

    if (metricsRes.ok) {
      const metricsData = await metricsRes.json();
      const rows = metricsData.rows || [];

      for (const row of rows) {
        await db.insert(gscDailyMetrics).values({
          propertyId: propertyRecord.id,
          date: new Date(),
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position
        });
      }
    }
  }

  return { accountId, propertiesSynced: siteEntries.length };
}

const worker = createGscSyncWorker(processGscSync);

worker.on("completed", (job, result) => {
  console.log(`[gsc-worker] Account ${result.accountId} synced ${result.propertiesSynced} properties.`);
});

worker.on("failed", (job, err) => {
  console.error(`[gsc-worker] Job ${job?.data.accountId} failed:`, err.message);
});

console.log("[gsc-worker] GSC Sync worker started, waiting for jobs…");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
