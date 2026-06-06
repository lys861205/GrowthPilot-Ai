"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { exportReportMarkdownAction } from "@/lib/report/actions";
import { Download, Loader2, FileText, FileDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportExportButton({ auditId }: { auditId: string }) {
  const [mdPending, startMd] = useTransition();
  const [pdfPending, setPdfPending] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleMarkdown() {
    setOpen(false);
    startMd(async () => {
      const result = await exportReportMarkdownAction(auditId);
      if (!result.success || !result.markdown) return;
      const blob = new Blob([result.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-report-${auditId.slice(0, 8)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handlePdf() {
    setOpen(false);
    setPdfPending(true);
    try {
      const res = await fetch(`/api/audit/${auditId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-report-${auditId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfPending(false);
    }
  }

  const busy = mdPending || pdfPending;

  return (
    <div ref={ref} className="relative">
      {/* Main button + chevron */}
      <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden">
        <button
          onClick={handlePdf}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          {pdfPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 text-indigo-500" />
          )}
          Export PDF
        </button>
        <div className="w-px bg-slate-200" />
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={busy}
          className="px-2 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-60 transition-colors"
          aria-label="More export options"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-10 py-1">
          <button
            onClick={handlePdf}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileDown className="h-4 w-4 text-indigo-500" />
            Export as PDF
          </button>
          <button
            onClick={handleMarkdown}
            disabled={busy}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {mdPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 text-slate-400" />
            )}
            Export as Markdown
          </button>
        </div>
      )}
    </div>
  );
}
