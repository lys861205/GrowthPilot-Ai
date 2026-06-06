"use client";

import { useActionState } from "react";
import { generateBlogPostAction } from "@/lib/content/actions";
import { Loader2, Sparkles } from "lucide-react";
import type { Site } from "@/lib/db/schema";

interface GenerateContentFormProps {
  sites: Site[];
  defaultSiteId?: string;
}

export function GenerateContentForm({ sites, defaultSiteId }: GenerateContentFormProps) {
  const [state, action, pending] = useActionState(generateBlogPostAction, null);

  return (
    <>
      {/* Full-screen loading overlay while AI generates the outline */}
      {pending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-base font-semibold text-slate-800">Generating outline…</p>
          <p className="mt-1 text-sm text-slate-500">AI is writing your blog structure, please wait.</p>
        </div>
      )}

      <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="siteId" className="text-sm font-medium text-slate-700">Site</label>
            <select
              id="siteId"
              name="siteId"
              defaultValue={defaultSiteId ?? ""}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>Choose a site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="keywords" className="text-sm font-medium text-slate-700">Target Keyword</label>
            <input
              id="keywords"
              name="keywords"
              type="text"
              required
              placeholder="e.g. best running shoes 2025"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="topic" className="text-sm font-medium text-slate-700">Topic / Title Idea</label>
          <input
            id="topic"
            name="topic"
            type="text"
            required
            placeholder="e.g. How to choose the right running shoes for beginners"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {state && !state.success && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating outline…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate Blog Post</>
          )}
        </button>
      </form>
    </>
  );
}
