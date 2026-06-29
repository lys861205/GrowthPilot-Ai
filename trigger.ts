import { db } from "./src/lib/db";
import { gscAccounts } from "./src/lib/db/schema";
import { gscSyncQueue } from "./src/lib/redis/queue";

async function main() {
  const accounts = await db.select().from(gscAccounts);
  if (accounts.length > 0) {
    const accountId = accounts[0].id;
    await gscSyncQueue.add("sync", { accountId });
    console.log("Enqueued sync for account", accountId);
  } else {
    console.log("No accounts found");
  }
  process.exit(0);
}
main();
