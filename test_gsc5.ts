import { db } from "./src/lib/db";
import { gscAccounts } from "./src/lib/db/schema";

async function main() {
  const account = await db.query.gscAccounts.findFirst();
  if (!account) return;

  const siteUrl = "sc-domain:aifupay.site";
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`, {
    headers: { Authorization: `Bearer ${account.accessToken}` }
  });
  
  console.log("Status:", res.status);
  console.log("Response:", await res.text());

  process.exit(0);
}
main();
