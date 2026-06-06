"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedItem {
  pageUrl: string;
  pageTitle: string | null;
  before: string | null;
  after: string;
  type: "title" | "meta";
}

interface OptimizedContentPanelProps {
  items: OptimizedItem[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function BeforeAfter({ before, after, label }: { before: string | null; after: string; label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {before && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
          <p className="text-xs font-medium text-red-400 mb-1">Before</p>
          <p className="text-sm text-red-700 leading-relaxed">{before}</p>
        </div>
      )}
      <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-green-500 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Optimized
            </p>
            <p className="text-sm text-green-800 leading-relaxed">{after}</p>
          </div>
          <CopyButton text={after} />
        </div>
      </div>
    </div>
  );
}

export function OptimizedContentPanel({ items }: OptimizedContentPanelProps) {
  const [selected, setSelected] = useState(0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No optimized suggestions available. Re-run the audit to generate AI recommendations.
      </p>
    );
  }

  const titleItems = items.filter((i) => i.type === "title");
  const metaItems = items.filter((i) => i.type === "meta");

  const allPages = Array.from(
    new Map(items.map((i) => [i.pageUrl, i])).keys()
  ).map((url) => ({ url, title: items.find((i) => i.pageUrl === url)?.pageTitle ?? null }));

  const currentPage = allPages[selected];
  const pageTitleItem = titleItems.find((i) => i.pageUrl === currentPage?.url);
  const pageMetaItem = metaItems.find((i) => i.pageUrl === currentPage?.url);

  return (
    <div className="space-y-4">
      {/* Page selector tabs */}
      {allPages.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {allPages.map((p, i) => (
            <button
              key={p.url}
              onClick={() => setSelected(i)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors max-w-[200px] truncate",
                i === selected
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              title={p.url}
            >
              {p.title ?? (new URL(p.url).pathname || "/")}
            </button>
          ))}
        </div>
      )}

      {/* Page URL */}
      {currentPage && (
        <a
          href={currentPage.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {currentPage.url}
        </a>
      )}

      {/* Before / After */}
      <div className="grid gap-4 sm:grid-cols-2">
        {pageTitleItem && (
          <BeforeAfter
            before={pageTitleItem.before}
            after={pageTitleItem.after}
            label="Page Title"
          />
        )}
        {pageMetaItem && (
          <BeforeAfter
            before={pageMetaItem.before}
            after={pageMetaItem.after}
            label="Meta Description"
          />
        )}
      </div>

      {!pageTitleItem && !pageMetaItem && (
        <p className="text-sm text-slate-500 italic">No title/meta optimizations for this page.</p>
      )}
    </div>
  );
}
