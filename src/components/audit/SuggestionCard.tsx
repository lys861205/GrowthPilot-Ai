import { IssueBadge } from "@/components/shared/IssueBadge";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionCardProps {
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
  pageUrl?: string | null;
  pageTitle?: string | null;
}

const PRIORITY_BORDER = {
  high: "border-l-red-400",
  medium: "border-l-yellow-400",
  low: "border-l-blue-300",
};

export function SuggestionCard({
  title,
  body,
  priority,
  pageUrl,
  pageTitle,
}: SuggestionCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm", PRIORITY_BORDER[priority])}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-semibold text-slate-900 leading-snug">{title}</h4>
        <IssueBadge severity={priority} className="shrink-0 mt-0.5" />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
      {pageUrl && (
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {pageTitle ?? pageUrl}
        </a>
      )}
    </div>
  );
}
