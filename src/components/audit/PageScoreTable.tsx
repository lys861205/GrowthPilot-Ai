"use client";

import { useState, Fragment } from "react";
import { IssueBadge } from "@/components/shared/IssueBadge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/lib/db/schema";

interface PageScoreTableProps {
  pages: Page[];
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600 bg-green-50";
  if (score >= 60) return "text-yellow-600 bg-yellow-50";
  if (score >= 40) return "text-orange-500 bg-orange-50";
  return "text-red-500 bg-red-50";
}

export function PageScoreTable({ pages }: PageScoreTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (pages.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No pages found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-600">Page</th>
            <th className="px-4 py-3 font-medium text-slate-600 text-right w-24">Score</th>
            <th className="px-4 py-3 font-medium text-slate-600 text-right w-20 hidden sm:table-cell">Issues</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {pages.map((page) => {
            const isOpen = expanded === page.id;
            const issues = page.issues ?? [];
            const highCount = issues.filter((i) => i.severity === "high").length;

            return (
              <Fragment key={page.id}>
                <tr
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : page.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 truncate max-w-xs">
                      {page.title ?? <span className="text-slate-400 italic">No title</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{page.url}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", scoreColor(page.score))}>
                      {page.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-slate-600">{issues.length}</span>
                    {highCount > 0 && (
                      <span className="ml-1 text-xs text-red-500">({highCount} crit)</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-slate-400">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </td>
                </tr>
                {isOpen && issues.length > 0 && (
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 pb-3 pt-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {issues.map((issue, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <IssueBadge severity={issue.severity} />
                            <span className="text-xs text-slate-600">{issue.type.replace(/_/g, " ")}</span>
                          </div>
                        ))}
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open page
                      </a>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
