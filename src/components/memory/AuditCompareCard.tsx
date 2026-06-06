import type { CompareResult } from "@/lib/redis/memory";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";

interface AuditRow {
  id: string;
  overallScore: number | null;
  completedAt: Date | null;
  pagesCrawled: number | null;
  issuesFound: number | null;
}

interface Props {
  comparison: CompareResult;
  audits: AuditRow[];
}

export function AuditCompareCard({ comparison, audits }: Props) {
  const { scoreDelta, trend, resolvedIssues, newIssues, persistentIssues, categoryChanges, pagesDelta, issuesDelta, blogsBetween } = comparison;

  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;
  const trendColor = trend === "improving" ? "text-green-600" : trend === "declining" ? "text-red-500" : "text-slate-500";
  const trendBg    = trend === "improving" ? "bg-green-50"   : trend === "declining" ? "bg-red-50"    : "bg-slate-50";
  const deltaStr   = scoreDelta > 0 ? `+${scoreDelta}` : String(scoreDelta);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className={`flex items-center gap-3 px-6 py-4 ${trendBg}`}>
        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
        <div>
          <p className={`text-lg font-bold ${trendColor}`}>
            {deltaStr} points — {trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable"}
          </p>
          <p className="text-xs text-slate-500">{comparison.summary}</p>
        </div>
      </div>

      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 p-0">
        {/* Left: stats */}
        <div className="p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Changes</h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Score change" value={deltaStr} positive={scoreDelta >= 0} />
            <MiniStat label="Pages change" value={pagesDelta >= 0 ? `+${pagesDelta}` : String(pagesDelta)} positive={pagesDelta >= 0} />
            <MiniStat label="Issues change" value={issuesDelta <= 0 ? `${issuesDelta}` : `+${issuesDelta}`} positive={issuesDelta <= 0} />
            {blogsBetween > 0 && (
              <div className="rounded-lg bg-indigo-50 p-3">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500 mb-1" />
                <p className="text-base font-semibold text-indigo-700">{blogsBetween}</p>
                <p className="text-xs text-indigo-500">blogs published</p>
              </div>
            )}
          </div>

          {/* Category changes */}
          {Object.keys(categoryChanges).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Category scores</p>
              <div className="space-y-1.5">
                {Object.entries(categoryChanges).map(([cat, { before, after, delta }]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{cat}</span>
                    <span className={delta > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {before} → {after} ({delta > 0 ? `+${delta}` : delta})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: issues */}
        <div className="p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issue Changes</h3>

          {resolvedIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <p className="text-xs font-medium text-green-700">Fixed ({resolvedIssues.length})</p>
              </div>
              <ul className="space-y-1">
                {resolvedIssues.map((t) => (
                  <li key={t} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">{formatIssueType(t)}</li>
                ))}
              </ul>
            </div>
          )}

          {newIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-medium text-red-700">New issues ({newIssues.length})</p>
              </div>
              <ul className="space-y-1">
                {newIssues.map((t) => (
                  <li key={t} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{formatIssueType(t)}</li>
                ))}
              </ul>
            </div>
          )}

          {persistentIssues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Still present ({persistentIssues.length})</p>
              <ul className="space-y-1">
                {persistentIssues.slice(0, 4).map((t) => (
                  <li key={t} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">{formatIssueType(t)}</li>
                ))}
                {persistentIssues.length > 4 && (
                  <li className="text-xs text-slate-400 px-2">+{persistentIssues.length - 4} more</li>
                )}
              </ul>
            </div>
          )}

          {resolvedIssues.length === 0 && newIssues.length === 0 && persistentIssues.length === 0 && (
            <p className="text-sm text-slate-400">No issue type changes between these audits.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className={`text-base font-bold ${positive ? "text-green-700" : "text-red-600"}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function formatIssueType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
