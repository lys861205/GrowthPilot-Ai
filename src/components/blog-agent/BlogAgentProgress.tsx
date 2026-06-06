"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { pollBlogAgentJobAction } from "@/lib/blog-agent/actions";
import { Loader2, CheckCircle2, XCircle, Sparkles, Brain, PenLine, HelpCircle, Database } from "lucide-react";

interface BlogAgentProgressProps {
  jobId: string;
  siteId: string;
}

type JobStatus = "pending" | "running" | "done" | "failed";

const STEPS = [
  {
    icon: Brain,
    label: "Analyzing site niche",
    detail: "Identifying keyword gaps from your SEO audit…",
  },
  {
    icon: PenLine,
    label: "Generating blog ideas",
    detail: "Creating 10 blog posts with titles and outlines…",
  },
  {
    icon: HelpCircle,
    label: "Writing FAQ sections",
    detail: "Generating FAQ for top-priority ideas…",
  },
  {
    icon: Database,
    label: "Saving results",
    detail: "Storing ideas to your dashboard…",
  },
];

export function BlogAgentProgress({ jobId, siteId }: BlogAgentProgressProps) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>("pending");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ideasGenerated, setIdeasGenerated] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const poll = useCallback(async () => {
    const result = await pollBlogAgentJobAction(jobId);
    if (!result.success) return;
    setStatus(result.status as JobStatus);
    if (result.status === "running") {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 2));
    }
    if (result.status === "done") {
      setIdeasGenerated(result.ideasGenerated ?? null);
      setStepIndex(STEPS.length - 1);
      setTimeout(() => router.push(`/dashboard/blog-agent?siteId=${siteId}`), 600);
    }
    if (result.status === "failed") {
      setError(result.errorMessage ?? "Generation failed. Please try again.");
    }
  }, [jobId, router]);

  // Poll every 3 s
  useEffect(() => {
    if (status === "done" || status === "failed") return;
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll, status]);

  // Auto-advance step indicator visually every ~14 s
  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const t = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 2));
    }, 14000);
    return () => clearInterval(t);
  }, [status]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Failed ──
  if (status === "failed") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
        <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-700 text-base">Generation Failed</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={() => router.push(`/dashboard/blog-agent?siteId=${siteId}`)}
            className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──
  if (status === "done") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex items-center gap-4">
        <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
        <div>
          <p className="font-bold text-green-800 text-lg">
            {ideasGenerated ? `${ideasGenerated} blog ideas ready!` : "Ideas ready!"}
          </p>
          <p className="text-sm text-green-600 mt-0.5 flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading results…
          </p>
        </div>
      </div>
    );
  }

  // ── Pending / Running ──
  const pct = Math.round(((stepIndex + (status === "running" ? 0.5 : 0)) / STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-indigo-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-indigo-400 border-2 border-white animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Blog Agent is running</p>
            <p className="text-xs text-slate-500 mt-0.5">
              You can freely navigate — this runs in the background
            </p>
          </div>
          <span className="ml-auto text-sm font-mono text-slate-400">{fmt(elapsed)}</span>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            const Icon = step.icon;
            return (
              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                active ? "bg-indigo-50 border border-indigo-100" :
                done ? "opacity-50" : "opacity-30"
              }`}>
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-indigo-500" :
                  active ? "bg-indigo-100" : "bg-slate-100"
                }`}>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : active ? (
                    <Loader2 className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? "text-indigo-800" : done ? "text-slate-500" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-xs text-indigo-500 mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-slate-400 text-center">
          Estimated time: 30–60 seconds · Step {stepIndex + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
