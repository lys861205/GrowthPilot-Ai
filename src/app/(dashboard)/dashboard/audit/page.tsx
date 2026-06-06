import { requireSession } from "@/lib/auth/session";
import { getSitesByUserId, getAuditsBySiteId } from "@/lib/db/queries";
import { TriggerAuditForm } from "@/components/audit/TriggerAuditForm";
import { ScoreRing } from "@/components/shared/ScoreRing";
import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ siteId?: string }>;
}

export default async function AuditPage({ searchParams }: Props) {
  const session = await requireSession();
  const { siteId } = await searchParams;
  const siteList = await getSitesByUserId(session.user.id);

  // Load recent audits across all sites
  const allAuditsList = await Promise.all(
    siteList.map((s) => getAuditsBySiteId(s.id))
  );
  const recentAudits = allAuditsList
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const siteMap = Object.fromEntries(siteList.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Audits</h1>
        <p className="mt-1 text-slate-500">Run a full crawl and analysis of any site you manage.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          New Audit
        </h2>
        <TriggerAuditForm sites={siteList} defaultSiteId={siteId} />
      </section>

      {recentAudits.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent Audits
          </h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {recentAudits.map((audit) => {
              const site = siteMap[audit.siteId];
              return (
                <li key={audit.id} className="flex items-center gap-4 px-5 py-4">
                  {audit.status === "done" ? (
                    <ScoreRing score={audit.overallScore ?? 0} size="sm" showLabel={false} />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-200">
                      <span className="text-xs font-medium text-slate-400 capitalize">{audit.status}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{site?.name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400 truncate">{site?.url}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(audit.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {audit.status === "done" && ` · ${audit.pagesCrawled} pages · ${audit.issuesFound} issues`}
                    </p>
                  </div>
                  {audit.status === "done" && (
                    <Link
                      href={`/dashboard/audit/${audit.id}`}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View report <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {audit.status === "running" && (
                    <Link
                      href={`/dashboard/audit/${audit.id}`}
                      className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      Watch live <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
