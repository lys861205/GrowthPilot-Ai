import { db } from "./src/lib/db";
import { gscAccounts } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const account = await db.query.gscAccounts.findFirst();
  if (!account) return;

  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${account.accessToken}` }
  });
  
  const sitesData = await sitesRes.json();
  const siteUrl = sitesData.siteEntry[0].siteUrl;

  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  console.log("Fetching for:", siteUrl);
  const metricsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query']
    })
  });

  console.log("Status:", metricsRes.status);
  const data = await metricsRes.text();
  console.log("Response:", data);

  process.exit(0);
}
main();
