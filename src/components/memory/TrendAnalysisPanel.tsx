"use client";

import { useEffect, useState } from "react";
import type { TrendAnalysis } from "@/lib/qwen/trend-analysis";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Zap, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

interface Props {
  siteId: string;
}

export function TrendAnalysisPanel({ siteId }: Props) {
  const [data, setData] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function load(bust = false) {
    setLoading(true);
    setError(null);
    try {
      if (bust) await fetch(`/api/memory/${siteId}/trends`, { method: "DELETE" });
      const res = await fetch(`/api/memory/${siteId}/trends`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setData(json);
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  useEffect(() => { load(); }, [siteId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 flex items-center gap-3 text-indigo-700">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Analyzing trends with AI…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">{error}</p>
        <button
          onClick={() => load()}
          className="text-xs text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { scoreTrend, improvementTrend, riskTrend, nextActions, overallInsight } = data;

  const ScoreTrendIcon =
    scoreTrend.direction === "improving" ? TrendingUp :
    scoreTrend.direction === "declining" ? TrendingDown : Minus;

  const scoreTrendColor =
    scoreTrend.direction === "improving" ? "text-green-600" :
    scoreTrend.direction === "declining" ? "text-red-500" : "text-slate-500";

  const riskColor: Record<string, string> = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  const priorityColor: Record<string, string> = {
    urgent: "bg-red-50 text-red-700",
    high: "bg-orange-50 text-orange-700",
    medium: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900">AI Trend Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Overall insight — always visible */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">{overallInsight}</p>
      </div>

      {expanded && (
        <div className="divide-y divide-slate-100">
          {/* Score Trend */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <ScoreTrendIcon className={`h-4 w-4 ${scoreTrendColor}`} />
              <h3 className="text-sm font-semibold text-slate-800">
                Score Trend —{" "}
                <span className={scoreTrendColor}>
                  {scoreTrend.direction.charAt(0).toUpperCase() + scoreTrend.direction.slice(1)}
                </span>
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">{scoreTrend.summary}</p>
            {scoreTrend.keyMilestones.length > 0 && (
              <div className="space-y-1.5">
                {scoreTrend.keyMilestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="shrink-0 text-slate-400 tabular-nums">{m.auditDate}</span>
                    <span className="font-medium text-indigo-600 shrink-0">Score {m.score}</span>
                    <span className="text-slate-500">{m.event}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement Trend */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-slate-800">Improvement Trend</h3>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                improvementTrend.consistency === "consistent" ? "bg-green-50 text-green-700" :
                improvementTrend.consistency === "sporadic"   ? "bg-yellow-50 text-yellow-700" :
                "bg-slate-100 text-slate-500"
              }`}>
                {improvementTrend.consistency}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{improvementTrend.summary}</p>
            {improvementTrend.topWins.length > 0 && (
              <div className="space-y-1.5">
                {improvementTrend.topWins.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-slate-700">{w.issue}</span>
                    <span className="text-slate-400">· {w.resolvedOn}</span>
                    <span className="ml-auto text-green-600 font-medium">+{w.scoreLift} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Trend */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-slate-800">Risk Trend</h3>
              <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-medium ${riskColor[riskTrend.level]}`}>
                {riskTrend.level.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{riskTrend.summary}</p>
            {riskTrend.persistentIssues.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Persistent issues</p>
                <div className="space-y-1.5">
                  {riskTrend.persistentIssues.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${
                        p.severity === "high" ? "bg-red-50 text-red-700" :
                        p.severity === "medium" ? "bg-yellow-50 text-yellow-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>{p.severity}</span>
                      <span className="text-slate-700">{p.issue}</span>
                      <span className="ml-auto text-slate-400">{p.auditsSeen} audits</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {riskTrend.newRisks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1.5">New in latest audit</p>
                <div className="flex flex-wrap gap-1.5">
                  {riskTrend.newRisks.map((r, i) => (
                    <span key={i} className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Actions */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Suggested Next Actions</h3>
            </div>
            <div className="space-y-3">
              {nextActions.map((a, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${priorityColor[a.priority]}`}>
                      {a.priority}
                    </span>
                    <span className="text-xs text-slate-400">{a.effort} effort</span>
                    <span className="ml-auto text-xs font-medium text-green-600">+{a.estimatedScoreLift} pts</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{a.action}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
