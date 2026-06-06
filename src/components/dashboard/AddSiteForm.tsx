"use client";

import { useActionState, useRef } from "react";
import { addSiteAction } from "@/lib/sites/actions";
import { Plus, Loader2 } from "lucide-react";

export function AddSiteForm() {
  const [state, action, pending] = useActionState(addSiteAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Site Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="My Website"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex-1 space-y-1">
        <label htmlFor="url" className="text-sm font-medium text-slate-700">
          URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <input type="hidden" name="platform" value="other" />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add Site
      </button>
      {state && !state.success && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}
    </form>
  );
}
