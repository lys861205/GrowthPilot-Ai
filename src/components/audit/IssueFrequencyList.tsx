import { IssueBadge } from "@/components/shared/IssueBadge";
import type { IssueFrequency } from "@/lib/report/types";

interface IssueFrequencyListProps {
  issues: IssueFrequency[];
  totalPages: number;
}

export function IssueFrequencyList({ issues, totalPages }: IssueFrequencyListProps) {
  if (issues.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">No issues found — great work!</p>
    );
  }

  const max = Math.max(...issues.map((i) => i.count), 1);

  return (
    <ul className="divide-y divide-slate-100">
      {issues.map((issue) => {
        const pct = Math.round((issue.count / totalPages) * 100);
        const barWidth = (issue.count / max) * 100;

        return (
          <li key={issue.type} className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-800 truncate">{issue.label}</span>
                <IssueBadge severity={issue.severity} />
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0 w-20">
              <p className="text-sm font-semibold text-slate-800">{issue.count} page{issue.count !== 1 ? "s" : ""}</p>
              <p className="text-xs text-slate-400">{pct}% of site</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
