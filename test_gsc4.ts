import { db } from "./src/lib/db";
import { gscAccounts } from "./src/lib/db/schema";

async function main() {
  const account = await db.query.gscAccounts.findFirst();
  if (!account) return;

  const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${account.accessToken}`);
  const data = await res.json();
  console.log("Token scopes:", data.scope);

  process.exit(0);
}
main();
