import { db } from "./src/lib/db";
import { gscAccounts } from "./src/lib/db/schema";

async function main() {
  const account = await db.query.gscAccounts.findFirst();
  if (!account) return;

  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${account.accessToken}` }
  });
  
  const sitesData = await sitesRes.json();
  console.log(JSON.stringify(sitesData, null, 2));

  process.exit(0);
}
main();
