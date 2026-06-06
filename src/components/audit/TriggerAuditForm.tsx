"use client";

import { useActionState } from "react";
import { triggerAuditAction } from "@/lib/audit/actions";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useEffect } from "react";
import type { Site } from "@/lib/db/schema";

interface TriggerAuditFormProps {
  sites: Site[];
  defaultSiteId?: string;
}

export function TriggerAuditForm({ sites, defaultSiteId }: TriggerAuditFormProps) {
  const [state, action, pending] = useActionState(triggerAuditAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.auditId) {
      router.push(`/dashboard/audit/${state.auditId}`);
    }
  }, [state, router]);

  if (sites.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
        <Search className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">You need to add a site before running an audit.</p>
        <a href="/dashboard/sites" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          Add a site →
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <label htmlFor="siteId" className="text-sm font-medium text-slate-700">
          Select Site
        </label>
        <select
          id="siteId"
          name="siteId"
          defaultValue={defaultSiteId ?? ""}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          <option value="" disabled>Choose a site…</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.url}
            </option>
          ))}
        </select>
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
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting audit…
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Run SEO Audit
          </>
        )}
      </button>
    </form>
  );
}
