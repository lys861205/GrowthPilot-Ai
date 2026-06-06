"use client";

import { useState, useTransition } from "react";
import { convertIdeaToPostAction } from "@/lib/blog-agent/actions";
import {
  ChevronDown,
  ChevronUp,
  Tag,
  Lightbulb,
  FileText,
  List,
  HelpCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogIdea } from "@/lib/db/schema";

const PRIORITY_STYLES = {
  high: "bg-red-50 border-red-200 text-red-700",
  medium: "bg-yellow-50 border-yellow-200 text-yellow-700",
  low: "bg-slate-100 border-slate-200 text-slate-600",
};

const INTENT_STYLES = {
  informational: "bg-blue-50 text-blue-700",
  commercial: "bg-purple-50 text-purple-700",
  transactional: "bg-green-50 text-green-700",
};

interface BlogIdeaCardProps {
  idea: BlogIdea;
  index: number;
}

export function BlogIdeaCard({ idea, index }: BlogIdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"outline" | "faq" | "keywords" | "meta">("outline");
  const [pending, startConvert] = useTransition();

  const faqItems = (idea.faq as Array<{ question: string; answer: string }> | null) ?? [];
  const outlineSections = idea.outline?.sections ?? [];
  const internalLinks = (idea.internalLinks as Array<{ anchorText: string; targetUrl: string; suggestedSection: string }> | null) ?? [];

  function handleConvert() {
    startConvert(async () => {
      await convertIdeaToPostAction(idea.id);
    });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-white shadow-sm overflow-hidden transition-shadow",
      expanded ? "shadow-md" : "hover:shadow"
    )}>
      {/* ── Header ── */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Index badge */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Priority */}
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", PRIORITY_STYLES[idea.priority])}>
              {idea.priority}
            </span>
            {/* Intent */}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", INTENT_STYLES[idea.intent as keyof typeof INTENT_STYLES] ?? "bg-slate-100 text-slate-600")}>
              {idea.intent}
            </span>
            {idea.convertedToPostId && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Post Created
              </span>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 leading-snug mb-1">{idea.recommendedTitle ?? idea.topic}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {idea.primaryKeyword}
            {idea.estimatedWordCount ? ` · ~${idea.estimatedWordCount} words` : ""}
            {faqItems.length > 0 ? ` · ${faqItems.length} FAQs` : ""}
          </p>
        </div>

        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Priority reason */}
          {idea.priorityReason && (
            <div className="flex gap-2 bg-indigo-50 border-b border-indigo-100 px-5 py-3">
              <Lightbulb className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">{idea.priorityReason}</p>
            </div>
          )}

          {/* Title variants */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Title Variants</p>
            <ul className="space-y-1.5">
              {((idea.titles as string[] | null) ?? []).map((title, i) => (
                <li key={i} className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                  title === idea.recommendedTitle
                    ? "bg-indigo-50 border border-indigo-200 font-medium text-indigo-900"
                    : "bg-slate-50 text-slate-700"
                )}>
                  {title === idea.recommendedTitle && (
                    <span className="shrink-0 rounded bg-indigo-600 px-1 py-0.5 text-[9px] font-bold text-white mt-0.5">✓</span>
                  )}
                  {title}
                </li>
              ))}
            </ul>
          </div>

          {/* Tabs */}
          <div className="px-5 pb-2">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-4">
              {([
                { key: "outline", icon: List, label: "Outline" },
                { key: "faq", icon: HelpCircle, label: `FAQ (${faqItems.length})` },
                { key: "keywords", icon: Tag, label: "Keywords" },
                { key: "meta", icon: FileText, label: "Meta" },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    activeTab === key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Outline tab */}
            {activeTab === "outline" && (
              <div className="space-y-2">
                {outlineSections.map((section, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{section.h2}</p>
                      <span className="text-xs text-slate-400">~{section.targetWords}w</span>
                    </div>
                    {section.subsections?.length > 0 && (
                      <ul className="mt-2 space-y-0.5 pl-3">
                        {section.subsections.map((sub, j) => (
                          <li key={j} className="text-xs text-slate-600 before:content-['›'] before:mr-1.5 before:text-slate-300">
                            {sub.h3}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                {internalLinks.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Internal Links</p>
                    {internalLinks.map((link, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600 mb-1">
                        <ExternalLink className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                        <span>Link "<strong>{link.anchorText}</strong>" → <span className="text-indigo-600">{link.targetUrl}</span> in "{link.suggestedSection}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAQ tab */}
            {activeTab === "faq" && (
              <div className="space-y-3">
                {faqItems.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">FAQs only generated for top-priority ideas.</p>
                ) : (
                  faqItems.map((item, i) => (
                    <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{item.question}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Keywords tab */}
            {activeTab === "keywords" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Primary Keyword</p>
                  <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                    {idea.primaryKeyword}
                  </span>
                </div>
                {((idea.secondaryKeywords as string[] | null) ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Secondary Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {((idea.secondaryKeywords as string[]) ?? []).map((kw, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meta tab */}
            {activeTab === "meta" && (
              <div className="space-y-3">
                {idea.metaTitle && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      Meta Title <span className="normal-case font-normal">({idea.metaTitle.length} chars)</span>
                    </p>
                    <p className="text-sm text-slate-800 font-medium">{idea.metaTitle}</p>
                  </div>
                )}
                {idea.metaDescription && (
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      Meta Description <span className="normal-case font-normal">({idea.metaDescription.length} chars)</span>
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{idea.metaDescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
            <button
              onClick={handleConvert}
              disabled={pending || !!idea.convertedToPostId}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {pending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating Post…</>
              ) : idea.convertedToPostId ? (
                <><CheckCircle2 className="h-4 w-4" /> Post Created</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Write This Post</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
