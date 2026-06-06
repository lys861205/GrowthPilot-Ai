import { cn } from "@/lib/utils";

interface IssueBadgeProps {
  severity: "high" | "medium" | "low";
  className?: string;
}

const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-600 border-blue-200",
};

export function IssueBadge({ severity, className }: IssueBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {severity}
    </span>
  );
}
