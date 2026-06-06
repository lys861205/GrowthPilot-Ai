"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IssueBadge } from "@/components/shared/IssueBadge";

interface Issue {
  type: string;
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
}

interface IssuesTabsProps {
  issues: Issue[];
  totalPages: number;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "high", label: "Critical" },
  { key: "medium", label: "Warnings" },
  { key: "low", label: "Low" },
] as const;

export function IssuesTabs({ issues, totalPages }: IssuesTabsProps) {
  const [tab, setTab] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = tab === "all" ? issues : issues.filter((i) => i.severity === tab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => {
          const count = t.key === "all" ? issues.length : issues.filter((i) => i.severity === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  tab === t.key ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Issue list */}
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No issues in this category.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((issue) => {
            const pct = totalPages > 0 ? Math.round((issue.count / totalPages) * 100) : 0;
            return (
              <li
                key={issue.type}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <IssueBadge severity={issue.severity} className="shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-800">{issue.label}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-24">
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          issue.severity === "high" ? "bg-red-400" :
                          issue.severity === "medium" ? "bg-yellow-400" : "bg-blue-300"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {issue.count} page{issue.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
