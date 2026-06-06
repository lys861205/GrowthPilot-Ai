import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { AuditReport } from "@/lib/report/types";

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  indigo: "#4f46e5",
  indigoLight: "#e0e7ff",
  green: "#16a34a",
  greenLight: "#dcfce7",
  yellow: "#ca8a04",
  yellowLight: "#fef9c3",
  red: "#dc2626",
  redLight: "#fee2e2",
  orange: "#ea580c",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.slate700,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.indigo,
  },
  headerLeft: { flex: 1 },
  brandTag: {
    fontSize: 8,
    color: C.indigo,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  reportTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 3,
  },
  siteMeta: { fontSize: 9, color: C.slate500 },
  scoreBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  scoreLabel: { fontSize: 7, color: C.white, marginTop: 1 },

  // ── Stats row ──
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  statLbl: { fontSize: 8 },

  // ── Section ──
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.slate900,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.slate300,
  },

  // ── Score breakdown ──
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  breakdownLabel: { width: 90, fontSize: 8, color: C.slate700 },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.slate100,
    borderRadius: 3,
    marginHorizontal: 8,
  },
  breakdownFill: { height: 6, borderRadius: 3 },
  breakdownScore: { width: 36, fontSize: 8, textAlign: "right", color: C.slate500 },

  // ── Issues ──
  issueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: C.slate50,
  },
  issueBadge: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginRight: 8,
    minWidth: 44,
    textAlign: "center",
  },
  issueLabel: { flex: 1, fontSize: 8, color: C.slate700 },
  issueCount: { fontSize: 8, color: C.slate500 },

  // ── Recommendation card ──
  recCard: {
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
    backgroundColor: C.slate50,
  },
  recTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.slate900, marginBottom: 3 },
  recBody: { fontSize: 8, color: C.slate700, lineHeight: 1.5 },
  recPage: { fontSize: 7, color: C.indigo, marginTop: 3 },

  // ── Optimized content ──
  beforeAfterGrid: { flexDirection: "row", gap: 10 },
  beforeAfterCol: { flex: 1 },
  baLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.slate500,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  beforeBox: {
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    marginBottom: 6,
  },
  afterBox: {
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  baFieldLabel: { fontSize: 7, color: C.slate500, marginBottom: 3 },
  baText: { fontSize: 8, color: C.slate700, lineHeight: 1.5 },

  // ── Insights ──
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  insightDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.indigo,
    marginTop: 2,
    marginRight: 7,
    flexShrink: 0,
  },
  insightText: { flex: 1, fontSize: 8, color: C.slate700, lineHeight: 1.5 },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.slate300,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.slate500 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  if (score >= 40) return C.orange;
  return C.red;
}

function severityColors(sev: string): { bg: string; text: string; border: string } {
  if (sev === "high") return { bg: C.redLight, text: C.red, border: C.red };
  if (sev === "medium") return { bg: C.yellowLight, text: C.yellow, border: C.yellow };
  return { bg: C.indigoLight, text: C.indigo, border: C.indigo };
}

function priorityBorderColor(priority: string): string {
  if (priority === "high") return C.red;
  if (priority === "medium") return C.yellow;
  return C.indigo;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBreakdownSection({ breakdown }: { breakdown: AuditReport["scoreBreakdown"] }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Score Breakdown</Text>
      {breakdown.map((b) => (
        <View key={b.category} style={s.breakdownRow}>
          <Text style={s.breakdownLabel}>{b.category}</Text>
          <View style={s.breakdownTrack}>
            <View
              style={[
                s.breakdownFill,
                { width: `${b.score}%`, backgroundColor: scoreColor(b.score) },
              ]}
            />
          </View>
          <Text style={s.breakdownScore}>
            {b.score}/100{b.issueCount > 0 ? ` · ${b.issueCount} issues` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function IssuesSection({ issues, totalPages }: { issues: AuditReport["topIssues"]; totalPages: number }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Issues ({issues.length})</Text>
      {issues.map((issue) => {
        const { bg, text, border } = severityColors(issue.severity);
        return (
          <View key={issue.type} style={s.issueRow}>
            <View style={[s.issueBadge, { backgroundColor: bg, borderWidth: 1, borderColor: border }]}>
              <Text style={{ color: text, fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                {issue.severity.toUpperCase()}
              </Text>
            </View>
            <Text style={s.issueLabel}>{issue.label}</Text>
            <Text style={s.issueCount}>{issue.count}/{totalPages} pages</Text>
          </View>
        );
      })}
    </View>
  );
}

function RecommendationsSection({ suggestions }: { suggestions: AuditReport["suggestions"] }) {
  const shown = suggestions.slice(0, 10);
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recommendations ({shown.length})</Text>
      {shown.map((rec) => (
        <View key={rec.id} style={[s.recCard, { borderLeftColor: priorityBorderColor(rec.priority) }]}>
          <Text style={s.recTitle}>{rec.title}</Text>
          <Text style={s.recBody}>{rec.body}</Text>
          {rec.page?.url && (
            <Text style={s.recPage}>{rec.page.url}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function OptimizedContentSection({ items }: { items: AuditReport["optimizedContent"] }) {
  if (items.length === 0) return null;

  // Group by page, take top 3 pages
  const pageUrls = [...new Set(items.map((i) => i.pageUrl))].slice(0, 3);

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>AI Optimized Content</Text>
      {pageUrls.map((url) => {
        const pageItems = items.filter((i) => i.pageUrl === url);
        const titleItem = pageItems.find((i) => i.type === "title");
        const metaItem = pageItems.find((i) => i.type === "meta");
        const pageLabel = pageItems[0]?.pageTitle ?? url;

        return (
          <View key={url} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 8, color: C.slate500, marginBottom: 6 }}>{pageLabel}</Text>
            <View style={s.beforeAfterGrid}>
              {titleItem && (
                <View style={s.beforeAfterCol}>
                  <Text style={s.baLabel}>Page Title</Text>
                  {titleItem.before && (
                    <View style={s.beforeBox}>
                      <Text style={s.baFieldLabel}>Before</Text>
                      <Text style={s.baText}>{titleItem.before}</Text>
                    </View>
                  )}
                  <View style={s.afterBox}>
                    <Text style={s.baFieldLabel}>✦ Optimized</Text>
                    <Text style={s.baText}>{titleItem.after}</Text>
                  </View>
                </View>
              )}
              {metaItem && (
                <View style={s.beforeAfterCol}>
                  <Text style={s.baLabel}>Meta Description</Text>
                  {metaItem.before && (
                    <View style={s.beforeBox}>
                      <Text style={s.baFieldLabel}>Before</Text>
                      <Text style={s.baText}>{metaItem.before}</Text>
                    </View>
                  )}
                  <View style={s.afterBox}>
                    <Text style={s.baFieldLabel}>✦ Optimized</Text>
                    <Text style={s.baText}>{metaItem.after}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InsightsSection({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Key Insights</Text>
      {insights.map((insight, i) => (
        <View key={i} style={s.insightRow}>
          <View style={s.insightDot} />
          <Text style={s.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────

interface AuditReportPDFProps {
  report: AuditReport;
}

export function AuditReportPDF({ report }: AuditReportPDFProps) {
  const score = report.audit.overallScore ?? 0;
  const color = scoreColor(score);
  const allSuggestions = [
    ...report.suggestionsByPriority.high,
    ...report.suggestionsByPriority.medium,
    ...report.suggestionsByPriority.low,
  ];

  return (
    <Document
      title={`SEO Report — ${report.site.name}`}
      author="GrowthPilot AI"
      subject="SEO Audit Report"
    >
      {/* ── Page 1: Header + Stats + Score Breakdown + Issues ── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.brandTag}>GrowthPilot AI</Text>
            <Text style={s.reportTitle}>SEO Audit Report</Text>
            <Text style={s.siteMeta}>{report.site.name} · {report.site.url}</Text>
            <Text style={[s.siteMeta, { marginTop: 2 }]}>
              Audited {formatDate(report.audit.completedAt)} · {report.audit.pagesCrawled} pages crawled
            </Text>
          </View>
          <View style={[s.scoreBubble, { backgroundColor: color }]}>
            <Text style={s.scoreNumber}>{score}</Text>
            <Text style={s.scoreLabel}>/ 100</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.redLight }]}>
            <Text style={[s.statNum, { color: C.red }]}>{report.issueCounts.critical}</Text>
            <Text style={[s.statLbl, { color: C.red }]}>Critical</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.yellowLight }]}>
            <Text style={[s.statNum, { color: C.yellow }]}>{report.issueCounts.warnings}</Text>
            <Text style={[s.statLbl, { color: C.yellow }]}>Warnings</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.greenLight }]}>
            <Text style={[s.statNum, { color: C.green }]}>{report.issueCounts.passed}</Text>
            <Text style={[s.statLbl, { color: C.green }]}>Passed</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.indigoLight }]}>
            <Text style={[s.statNum, { color: C.indigo }]}>{report.audit.pagesCrawled}</Text>
            <Text style={[s.statLbl, { color: C.indigo }]}>Pages</Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <ScoreBreakdownSection breakdown={report.scoreBreakdown} />

        {/* Issues */}
        <IssuesSection issues={report.topIssues} totalPages={report.audit.pagesCrawled} />

        {/* Key Insights */}
        <InsightsSection insights={report.insights} />

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>GrowthPilot AI · {report.site.name}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ── Page 2: Recommendations + Optimized Content ── */}
      <Page size="A4" style={s.page}>
        <RecommendationsSection suggestions={allSuggestions} />
        <OptimizedContentSection items={report.optimizedContent} />

        <View style={s.footer} fixed>
          <Text style={s.footerText}>GrowthPilot AI · {report.site.name}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
