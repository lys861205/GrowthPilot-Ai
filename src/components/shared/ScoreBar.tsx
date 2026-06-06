import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  issueCount?: number;
  highCount?: number;
  className?: string;
}

function barColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-400";
  if (score >= 40) return "bg-orange-400";
  return "bg-red-500";
}

export function ScoreBar({ label, score, issueCount, highCount, className }: ScoreBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          {issueCount !== undefined && issueCount > 0 && (
            <span className="text-xs text-slate-400">
              {issueCount} issue{issueCount !== 1 ? "s" : ""}
              {highCount ? `, ${highCount} critical` : ""}
            </span>
          )}
          <span className="font-semibold text-slate-900 tabular-nums w-12 text-right">
            {score}/100
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
