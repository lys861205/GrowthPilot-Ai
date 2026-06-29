import { db } from "./src/lib/db";
import { gscProperties, gscDailyMetrics } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const props = await db.select().from(gscProperties);
  console.log("Properties found:", props.map(p => p.propertyUrl));
  
  const metricsCount = await db.select({ count: sql<number>`count(*)` }).from(gscDailyMetrics);
  console.log("Total metrics rows:", metricsCount[0].count);
  
  const recentMetrics = await db.select().from(gscDailyMetrics).limit(5);
  console.log("Sample metrics:", recentMetrics);

  process.exit(0);
}
main();
