"use client";

import { useEffect, useState } from "react";
import type { ActionPlan, DayPlan, ActionTask } from "@/lib/qwen/action-plan";
import {
  Calendar, Zap, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Clock, TrendingUp, AlertCircle,
} from "lucide-react";

interface Props {
  auditId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  content:     "bg-blue-50 text-blue-700",
  technical:   "bg-purple-50 text-purple-700",
  "on-page":   "bg-indigo-50 text-indigo-700",
  links:       "bg-cyan-50 text-cyan-700",
  performance: "bg-orange-50 text-orange-700",
};

const EFFORT_ICON: Record<string, string> = {
  low:    "●○○",
  medium: "●●○",
  high:   "●●●",
};

export function ActionPlanPanel({ auditId }: Props) {
  const [plan, setPlan]       = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<number>(1);

  async function load(bust = false) {
    setLoading(true);
    setError(null);
    try {
      if (bust) await fetch(`/api/audit/${auditId}/action-plan`, { method: "DELETE" });
      const res  = await fetch(`/api/audit/${auditId}/action-plan`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setPlan(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [auditId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 flex items-center gap-3 text-indigo-700">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Generating your 7-day action plan…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={() => load()} className="text-xs text-indigo-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!plan) return null;

  const totalLift = plan.totalEstimatedScoreLift;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900">7-Day Action Plan</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-green-600 font-medium">
            +{totalLift} pts estimated
          </span>
          <button
            onClick={() => load(true)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </button>
        </div>
      </div>

      {/* Week focus */}
      <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
        <p className="text-sm text-indigo-800">
          <span className="font-medium">This week: </span>{plan.weekFocus}
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex overflow-x-auto border-b border-slate-100">
        {plan.days.map((d) => (
          <button
            key={d.day}
            onClick={() => setOpenDay(d.day)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              openDay === d.day
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      {/* Active day */}
      {plan.days
        .filter((d) => d.day === openDay)
        .map((d) => (
          <DayDetail key={d.day} day={d} />
        ))}
    </div>
  );
}

function DayDetail({ day }: { day: DayPlan }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          Day {day.day}
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{day.focus}</h3>
      </div>

      <div className="space-y-4">
        {day.tasks.map((task, i) => (
          <TaskCard key={i} task={task} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, index }: { task: ActionTask; index: number }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {index}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800">{task.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[task.category] ?? "bg-slate-100 text-slate-600"}`}>
            {task.category}
          </span>
          <span className="text-xs font-medium text-green-600">+{task.scoreLift}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoBlock icon={AlertCircle} label="Why" text={task.reason} />
            <InfoBlock icon={TrendingUp} label="Expected impact" text={task.expectedImpact} />
            <div className="rounded-lg bg-white border border-slate-200 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Effort</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 capitalize">{task.estimatedEffort}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{EFFORT_ICON[task.estimatedEffort]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-sm text-slate-700 leading-snug">{text}</p>
    </div>
  );
}
