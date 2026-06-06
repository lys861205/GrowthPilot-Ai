"use client";

import { useEffect } from "react";
import { useAuditStream } from "@/hooks/useAuditStream";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditProgressPanelProps {
  auditId: string;
  initialStatus: string;
}

const EVENT_LABELS: Record<string, string> = {
  crawl_start: "Starting crawl…",
  crawl_progress: "Crawling pages…",
  crawl_done: "Crawl complete",
  analysis_start: "Analysing SEO issues…",
  analysis_done: "Analysis complete",
  ai_suggestions: "Generating AI suggestions…",
  ai_growth: "Building growth roadmap…",
  memory_saved: "Saving audit memory…",
  done: "Audit complete!",
  error: "An error occurred",
};

export function AuditProgressPanel({ auditId, initialStatus }: AuditProgressPanelProps) {
  const { events, status, progress, connect } = useAuditStream();
  const router = useRouter();

  useEffect(() => {
    if (initialStatus === "running" || initialStatus === "pending") {
      connect(auditId);
    }
  }, [auditId, initialStatus, connect]);

  useEffect(() => {
    if (status === "done") {
      const t = setTimeout(() => router.refresh(), 1200);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  if (initialStatus === "done") return null;

  const failed = status === "error";
  const completed = status === "done";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : failed ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
        )}
        <span className={cn("text-sm font-medium", failed ? "text-red-600" : completed ? "text-green-700" : "text-slate-700")}>
          {completed ? "Audit complete — loading report…" : failed ? "Audit failed" : "Audit in progress…"}
        </span>
        <span className="ml-auto text-sm font-semibold text-indigo-600">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            failed ? "bg-red-400" : completed ? "bg-green-500" : "bg-indigo-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Event log */}
      <ul className="space-y-1 max-h-40 overflow-y-auto text-xs text-slate-500">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
            {EVENT_LABELS[e.type] ?? e.type}
            {e.message && <span className="text-slate-400">— {e.message}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
