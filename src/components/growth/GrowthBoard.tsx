"use client";

import { useOptimistic, useTransition } from "react";
import { toggleGrowthItemAction, deleteGrowthItemAction } from "@/lib/growth/actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrowthRecommendation } from "@/lib/db/schema";

interface GrowthBoardProps {
  items: GrowthRecommendation[];
}

const IMPACT_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-600",
};

const EFFORT_COLORS = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export function GrowthBoard({ items }: GrowthBoardProps) {
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (state, { id, done }: { id: string; done: boolean }) =>
      state.map((item) => (item.id === id ? { ...item, done } : item))
  );
  const [, startTransition] = useTransition();
  const router = useRouter();

  function toggle(item: GrowthRecommendation) {
    startTransition(async () => {
      setOptimistic({ id: item.id, done: !item.done });
      await toggleGrowthItemAction(item.id, !item.done);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteGrowthItemAction(id);
      router.refresh();
    });
  }

  if (optimistic.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
        <p className="text-sm text-slate-400">No growth recommendations yet. Run an audit to generate your roadmap.</p>
      </div>
    );
  }

  const pending = optimistic.filter((i) => !i.done);
  const done = optimistic.filter((i) => i.done);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">To Do ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map((item) => (
              <GrowthCard key={item.id} item={item} onToggle={toggle} onDelete={remove} />
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Completed ({done.length})</h3>
          <div className="space-y-3 opacity-60">
            {done.map((item) => (
              <GrowthCard key={item.id} item={item} onToggle={toggle} onDelete={remove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthCard({
  item,
  onToggle,
  onDelete,
}: {
  item: GrowthRecommendation;
  onToggle: (item: GrowthRecommendation) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm", item.done && "line-through text-slate-400")}>
      <button
        onClick={() => onToggle(item)}
        className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
      >
        {item.done ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-medium text-slate-900 text-sm">{item.title}</p>
          <Badge label={item.impact} colorClass={IMPACT_COLORS[item.impact as keyof typeof IMPACT_COLORS] ?? "bg-slate-100 text-slate-600"} prefix="Impact:" />
          <Badge label={item.effort} colorClass={EFFORT_COLORS[item.effort as keyof typeof EFFORT_COLORS] ?? "bg-slate-100 text-slate-600"} prefix="Effort:" />
        </div>
        {item.description && (
          <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Badge({ label, colorClass, prefix }: { label: string; colorClass: string; prefix: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", colorClass)}>
      {prefix} {label}
    </span>
  );
}
