"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { triggerBlogAgentAction } from "@/lib/blog-agent/actions";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import type { Site } from "@/lib/db/schema";

interface BlogAgentFormProps {
  sites: Site[];
  audits: Array<{ id: string; siteId: string; overallScore: number | null; createdAt: Date }>;
  defaultSiteId?: string;
  disabled?: boolean;
}

export function BlogAgentForm({ sites, audits, defaultSiteId, disabled }: BlogAgentFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(triggerBlogAgentAction, null);
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId ?? sites[0]?.id ?? "");

  const siteAudits = audits.filter((a) => a.siteId === selectedSiteId);

  function handleSiteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSiteId = e.target.value;
    setSelectedSiteId(newSiteId);
    // Update URL so the page reloads ideas + progress for the new site
    router.push(`/dashboard/blog-agent?siteId=${newSiteId}`);
  }

  return (
    <form action={action} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-slate-900">Blog Agent</h2>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">AI</span>
      </div>
      <p className="text-sm text-slate-500 -mt-2">
        Analyze your SEO audit and generate 10 ready-to-write blog ideas with outlines, keywords, and FAQ sections.
      </p>

      {/* Site selector — changing navigates to ?siteId=xxx to reload ideas */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Website</label>
        <div className="relative">
          <select
            name="siteId"
            value={selectedSiteId}
            onChange={handleSiteChange}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.url}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Audit selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          SEO Audit <span className="text-slate-400 font-normal">(optional — uses latest if not selected)</span>
        </label>
        <div className="relative">
          <select
            name="auditId"
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Use latest audit</option>
            {siteAudits.map((a) => (
              <option key={a.id} value={a.id}>
                {`Audit — Score ${a.overallScore ?? "?"}/100 (${new Date(a.createdAt).toISOString().slice(0, 10)})`}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {state && !state.success && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || disabled || sites.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Blog Ideas
          </>
        )}
      </button>

      {disabled && (
        <p className="text-xs text-center text-slate-400">A generation is already in progress above ↑</p>
      )}
    </form>
  );
}
