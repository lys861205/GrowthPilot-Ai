import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sites, audits } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getScoreHistoryAsc,
  getUserContext,
  getRecsSnapshots,
  compareAudits,
} from "@/lib/redis/memory";
import { ScoreRing } from "@/components/shared/ScoreRing";
import { ScoreTrendChart } from "@/components/memory/ScoreTrendChart";
import { AuditCompareCard } from "@/components/memory/AuditCompareCard";
import { AuditComparePicker } from "@/components/memory/AuditComparePicker";
import { TrendAnalysisPanel } from "@/components/memory/TrendAnalysisPanel";
import { ArrowRight, BarChart2, TrendingUp, Clock } from "lucide-react";

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ compareWith?: string }>;
}) {
  const { id: siteId } = await params;
  const { compareWith } = await searchParams;
  const session = await requireSession();

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });
  if (!site) notFound();

  // All done audits for picker + list
  const allAudits = await db.query.audits.findMany({
    where: and(eq(audits.siteId, siteId), eq(audits.status, "done")),
    orderBy: desc(audits.completedAt),
    columns: { id: true, overallScore: true, completedAt: true, pagesCrawled: true, issuesFound: true },
  });

  const [redisHistory, context, recentRecs] = await Promise.all([
    getScoreHistoryAsc(siteId, 20),
    getUserContext(session.user.id, siteId),
    getRecsSnapshots(siteId, 1),
  ]);

  // Redis first; fall back to PG audit list if Redis is empty
  const history =
    redisHistory.length > 0
      ? redisHistory
      : allAudits
          .filter((a) => a.completedAt !== null)
          .slice()
          .reverse()
          .map((a) => ({
            auditId:      a.id,
            score:        a.overallScore ?? 0,
            pagesCrawled: a.pagesCrawled ?? 0,
            issuesFound:  a.issuesFound  ?? 0,
            completedAt:  a.completedAt!.toISOString(),
          }));

  // Determine which two audits to compare
  // baseAudit = always the latest; compareAudit = user-selected or second-latest
  const baseAudit    = allAudits[0];
  const compareAudit = compareWith
    ? allAudits.find((a) => a.id === compareWith)
    : allAudits[1];

  let comparison = null;
  if (baseAudit && compareAudit && baseAudit.id !== compareAudit.id) {
    comparison = await compareAudits(compareAudit.id, baseAudit.id, siteId).catch(() => null);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            <Link href="/dashboard/sites" className="hover:underline">Sites</Link>
            {" / "}
            <span className="text-slate-700 font-medium">{site.name}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{site.name}</h1>
          <p className="text-sm text-slate-500">{site.url}</p>
        </div>
        <Link
          href={`/dashboard/audit?siteId=${siteId}`}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          New Audit <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Context stat cards */}
      {context && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Audits" value={context.totalAudits} icon={BarChart2} color="indigo" />
          <StatCard label="Best Score" value={context.bestScore} icon={TrendingUp} color="green" suffix="/100" />
          <StatCard label="Worst Score" value={context.worstScore} icon={BarChart2} color="red" suffix="/100" />
          <StatCard
            label="Avg Score Change"
            value={Number(context.avgScoreChange) >= 0 ? `+${context.avgScoreChange}` : context.avgScoreChange}
            icon={TrendingUp}
            color={Number(context.avgScoreChange) >= 0 ? "green" : "red"}
          />
        </div>
      )}

      {/* Score trend chart */}
      {history.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Score History
          </h2>
          <ScoreTrendChart data={history} />
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          Run at least one audit to see score trends.
        </div>
      )}

      {/* AI Trend Analysis */}
      {allAudits.length >= 2 && (
        <section>
          <TrendAnalysisPanel siteId={siteId} />
        </section>
      )}

      {/* Audit comparison */}
      {allAudits.length >= 2 && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Audit Comparison</h2>
            <AuditComparePicker
              siteId={siteId}
              allAudits={allAudits.map((a) => ({
                id: a.id,
                overallScore: a.overallScore,
                completedAt: a.completedAt?.toISOString() ?? null,
              }))}
              baseAuditId={baseAudit?.id ?? ""}
              selectedCompareId={compareAudit?.id ?? ""}
            />
          </div>
          {comparison ? (
            <AuditCompareCard comparison={comparison} audits={[compareAudit!, baseAudit!]} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Select two different audits to compare.
            </div>
          )}
        </section>
      )}

      {/* All audits list */}
      {allAudits.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              All Audits ({allAudits.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {allAudits.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/audit/${a.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <ScoreRing score={a.overallScore ?? 0} size="sm" showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">Score: {a.overallScore}/100</p>
                  <p className="text-xs text-slate-400">
                    {a.pagesCrawled} pages · {a.issuesFound} issues
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest recommendations */}
      {recentRecs.length > 0 && recentRecs[0].items.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Latest Recommendations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentRecs[0].items.slice(0, 4).map((rec, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    rec.impact === "high" ? "bg-red-50 text-red-700" :
                    rec.impact === "medium" ? "bg-yellow-50 text-yellow-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {rec.impact} impact
                  </span>
                  <span className="text-xs text-slate-400">{rec.category}</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{rec.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, suffix = "",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: "indigo" | "green" | "red";
  suffix?: string;
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-green-50 text-green-600",
    red:    "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}{suffix}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}
