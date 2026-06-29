import { db } from "./src/lib/db";
import { gscAccounts, gscProperties, gscDailyMetrics } from "./src/lib/db/schema";

async function main() {
  await db.delete(gscDailyMetrics);
  await db.delete(gscProperties);
  await db.delete(gscAccounts);
  console.log("Cleared GSC tables.");
  process.exit(0);
}
main();
