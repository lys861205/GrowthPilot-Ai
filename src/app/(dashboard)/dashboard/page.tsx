import { requireSession } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/db/queries";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ScoreRing } from "@/components/shared/ScoreRing";
import { Globe, Search, AlertTriangle, FileText, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-slate-500">
          Here&apos;s an overview of your SEO performance.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Sites" value={stats.totalSites} icon={Globe} />
        <StatsCard label="Audits Run" value={stats.totalAudits} icon={Search} />
        <StatsCard label="Issues Found" value={stats.totalIssues} icon={AlertTriangle} />
        <StatsCard label="Content Pieces" value={stats.totalContent} icon={FileText} />
      </div>

      {/* Recent audits */}
      {stats.recentAudits.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Audits</h2>
            <Link
              href="/dashboard/audit"
              className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/dashboard/audit/${audit.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <ScoreRing score={audit.overallScore ?? 0} size="sm" showLabel={false} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{audit.site?.name ?? "Unknown site"}</p>
                  <p className="text-xs text-slate-400 truncate">{audit.site?.url}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {audit.pagesCrawled} pages · {audit.issuesFound} issues
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
      <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-3 text-lg font-semibold text-slate-700">No audits yet</h3>
      <p className="mt-1 text-sm text-slate-400">Add a site and run your first SEO audit to get started.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/dashboard/sites"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Add a site
        </Link>
        <Link
          href="/dashboard/audit"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Run audit
        </Link>
      </div>
    </div>
  );
}
