import { requireSession } from "@/lib/auth/session";
import { getAuditReportAction } from "@/lib/report/actions";
import { getAuditById } from "@/lib/db/queries";
import { notFound, redirect } from "next/navigation";
import { AuditSummaryCard } from "@/components/audit/AuditSummaryCard";
import { AuditProgressPanel } from "@/components/audit/AuditProgressPanel";
import { IssuesTabs } from "@/components/audit/IssuesTabs";
import { IssueCountRow } from "@/components/audit/IssueCountRow";
import { SuggestionCard } from "@/components/audit/SuggestionCard";
import { PageScoreTable } from "@/components/audit/PageScoreTable";
import { OptimizedContentPanel } from "@/components/audit/OptimizedContentPanel";
import { ScoreBar } from "@/components/shared/ScoreBar";
import { ReportExportButton } from "@/components/audit/ReportExportButton";
import { ActionPlanPanel } from "@/components/audit/ActionPlanPanel";
import {
  Sparkles,
  BarChart2,
  AlertTriangle,
  ListChecks,
  FileText,
  Wand2,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuditDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();

  const audit = await getAuditById(id);
  if (!audit) notFound();
  if (audit.site.userId !== session.user.id) redirect("/dashboard/audit");

  if (audit.status !== "done") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Running</h1>
          <p className="mt-1 text-slate-500">{audit.site.name} — {audit.site.url}</p>
        </div>
        <AuditProgressPanel auditId={id} initialStatus={audit.status} />
      </div>
    );
  }

  const result = await getAuditReportAction(id);
  if (!result.success) notFound();
  const { report } = result;

  const allSuggestions = [
    ...report.suggestionsByPriority.high,
    ...report.suggestionsByPriority.medium,
    ...report.suggestionsByPriority.low,
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SEO Report</h1>
          <p className="mt-1 text-slate-500">{report.site.name} — {report.site.url}</p>
        </div>
        <ReportExportButton auditId={id} />
      </div>

      {/* ── Score hero card ── */}
      <AuditSummaryCard
        score={report.audit.overallScore ?? 0}
        scoreChange={report.scoreChange}
        pagesCrawled={report.audit.pagesCrawled}
        issuesFound={report.audit.issuesFound}
        siteName={report.site.name}
        siteUrl={report.site.url}
        completedAt={report.audit.completedAt}
      />

      {/* ── Issue count row ── */}
      <IssueCountRow
        critical={report.issueCounts.critical}
        warnings={report.issueCounts.warnings}
        passed={report.issueCounts.passed}
      />

      {/* ── Score breakdown ── */}
      <Section icon={BarChart2} title="Score Breakdown">
        <div className="space-y-3">
          {report.scoreBreakdown.map((b) => (
            <ScoreBar
              key={b.category}
              label={b.category}
              score={b.score}
              issueCount={b.issueCount}
              highCount={b.highCount}
            />
          ))}
        </div>
      </Section>

      {/* ── AI Optimized Content ── */}
      {report.optimizedContent.length > 0 && (
        <Section icon={Wand2} title="AI Optimized Content">
          <OptimizedContentPanel items={report.optimizedContent} />
        </Section>
      )}

      {/* ── Issues (tabbed) ── */}
      <Section icon={AlertTriangle} title="Issues">
        <IssuesTabs
          issues={report.topIssues}
          totalPages={report.audit.pagesCrawled}
        />
      </Section>

      {/* ── Recommendations ── */}
      {allSuggestions.length > 0 && (
        <Section icon={ListChecks} title="Recommendations">
          <div className="space-y-3">
            {allSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                title={s.title}
                body={s.body}
                priority={s.priority as "high" | "medium" | "low"}
                pageUrl={s.page?.url}
                pageTitle={s.page?.title}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Growth Roadmap ── */}
      {report.growthRecommendations.length > 0 && (
        <Section icon={Sparkles} title="Growth Roadmap">
          <div className="space-y-3">
            {report.growthRecommendations.map((g) => (
              <div
                key={g.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{g.title}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                      {g.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{g.description}</p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <ImpactBadge label="Impact" value={g.impact} />
                  <ImpactBadge label="Effort" value={g.effort} invert />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Key Insights ── */}
      {report.insights.length > 0 && (
        <Section icon={Sparkles} title="Key Insights">
          <ul className="space-y-2">
            {report.insights.map((insight, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── 7-Day Action Plan ── */}
      <Section icon={Sparkles} title="7-Day Action Plan">
        <ActionPlanPanel auditId={report.audit.id} />
      </Section>

      {/* ── Pages ── */}
      <Section icon={FileText} title={`Pages (${report.pages.length})`}>
        <PageScoreTable pages={report.pagesByScore} />
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-indigo-500" />
        {title}
      </h2>
      {children}
    </section>
  );
}

const IMPACT_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-slate-100 text-slate-600",
};

function ImpactBadge({ label, value, invert = false }: { label: string; value: string; invert?: boolean }) {
  const colorKey = invert
    ? value === "high" ? "low" : value === "low" ? "high" : "medium"
    : value as "high" | "medium" | "low";

  return (
    <div className="flex items-center gap-1 justify-end">
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold capitalize ${IMPACT_COLORS[colorKey as keyof typeof IMPACT_COLORS] ?? IMPACT_COLORS.medium}`}>
        {value}
      </span>
    </div>
  );
}
