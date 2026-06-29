import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { gscAccounts, gscProperties, gscDailyMetrics } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { SyncButton } from "./SyncButton";
export default async function KeywordsPage() {
  const session = await requireSession();

  const accounts = await db
    .select()
    .from(gscAccounts)
    .where(eq(gscAccounts.userId, session.user.id));

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-lg font-semibold text-slate-700">Google Search Console Not Connected</h3>
        <p className="mt-1 text-sm text-slate-400">Connect your Google Search Console account to track real keyword performance.</p>
        <div className="mt-6">
          <Link
            href="/dashboard/settings"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const account = accounts[0];
  const properties = await db
    .select()
    .from(gscProperties)
    .where(eq(gscProperties.gscAccountId, account.id));

  if (properties.length === 0) {
     return (
       <div className="p-8 text-center text-slate-500">
         Syncing properties... Please check back later.
       </div>
     );
  }

async function PropertyKeywordsCard({ property }: { property: typeof gscProperties.$inferSelect }) {
  const [topMetrics, strikingMetrics] = await Promise.all([
    db
      .select()
      .from(gscDailyMetrics)
      .where(eq(gscDailyMetrics.propertyId, property.id))
      .orderBy(desc(gscDailyMetrics.clicks))
      .limit(20),
    db
      .select()
      .from(gscDailyMetrics)
      .where(
        and(
          eq(gscDailyMetrics.propertyId, property.id),
          sql`${gscDailyMetrics.impressions} > 0`, // Lowered for testing (normally > 1000)
          sql`${gscDailyMetrics.position} > 10`,   // Lowered for testing (normally 11-40)
          sql`${gscDailyMetrics.ctr} < 0.05`       // Lowered for testing
        )
      )
      .orderBy(desc(gscDailyMetrics.impressions))
      .limit(10)
  ]);

  return (
    <div className="space-y-6">
      {/* Striking Distance Card */}
      {strikingMetrics.length > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Striking Distance Keywords for {property.propertyUrl}
            </CardTitle>
            <CardDescription className="text-indigo-700/70">
              Keywords ranking on page 2-4 with high impressions but low clicks. Boost them with AI content!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-indigo-900">Query</TableHead>
                  <TableHead className="text-right text-indigo-900">Impressions</TableHead>
                  <TableHead className="text-right text-indigo-900">Position</TableHead>
                  <TableHead className="text-right text-indigo-900">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strikingMetrics.map((m) => (
                  <TableRow key={m.id} className="hover:bg-indigo-50/50">
                    <TableCell className="font-medium text-indigo-900">{m.query}</TableCell>
                    <TableCell className="text-right text-slate-600">{m.impressions}</TableCell>
                    <TableCell className="text-right text-slate-600">{m.position?.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/content?keyword=${encodeURIComponent(m.query ?? "")}&siteId=${property.siteId}`}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                      >
                        Boost with Content AI
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Standard Top Keywords Card */}
      <Card>
        <CardHeader>
          <CardTitle>Top Keywords for {property.propertyUrl}</CardTitle>
          <CardDescription>Based on recent Google Search data</CardDescription>
        </CardHeader>
        <CardContent>
          {topMetrics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMetrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.query}</TableCell>
                    <TableCell className="text-right">{m.clicks}</TableCell>
                    <TableCell className="text-right">{m.impressions}</TableCell>
                    <TableCell className="text-right">
                      {m.ctr ? (m.ctr * 100).toFixed(2) + "%" : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.position ? m.position.toFixed(1) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-slate-500">
              No keyword data available yet. Waiting for background sync.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keywords Performance</h1>
          <p className="mt-1 text-slate-500">Real ranking data from Google Search Console</p>
        </div>
        <SyncButton accountId={account.id} />
      </div>

      <div className="grid gap-6">
        {properties.map(property => (
          <PropertyKeywordsCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
