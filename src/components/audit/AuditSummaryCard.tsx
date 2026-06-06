import { ScoreRing } from "@/components/shared/ScoreRing";
import { TrendingUp, TrendingDown, Minus, Globe, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditSummaryCardProps {
  score: number;
  scoreChange: number | null;
  pagesCrawled: number;
  issuesFound: number;
  siteName: string;
  siteUrl: string;
  completedAt: Date | string | null;
}

export function AuditSummaryCard({
  score,
  scoreChange,
  pagesCrawled,
  issuesFound,
  siteName,
  siteUrl,
  completedAt,
}: AuditSummaryCardProps) {
  const date = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <ScoreRing score={score} size="lg" />

        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{siteName}</h2>
            <p className="text-sm text-slate-500">{siteUrl}</p>
            {date && <p className="mt-0.5 text-xs text-slate-400">Completed {date}</p>}
          </div>

          {scoreChange !== null && (
            <ScoreChangePill change={scoreChange} />
          )}

          <div className="flex flex-wrap gap-4">
            <Stat icon={Globe} label="Pages crawled" value={pagesCrawled} />
            <Stat icon={FileText} label="Issues found" value={issuesFound} highlight={issuesFound > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreChangePill({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
        <TrendingUp className="h-3.5 w-3.5" />+{change} pts vs last audit
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
        <TrendingDown className="h-3.5 w-3.5" />{change} pts vs last audit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500">
      <Minus className="h-3.5 w-3.5" />No change vs last audit
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", highlight ? "text-orange-500" : "text-slate-400")} />
      <div>
        <p className={cn("text-lg font-bold leading-none", highlight ? "text-orange-600" : "text-slate-900")}>
          {value}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
