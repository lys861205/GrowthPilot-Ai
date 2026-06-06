import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";

// ── Output schema ─────────────────────────────────────────────────────────────

export const trendAnalysisSchema = z.object({
  scoreTrend: z.object({
    direction: z.enum(["improving", "declining", "stable", "volatile"]),
    summary: z.string(),
    keyMilestones: z.array(
      z.object({
        auditDate: z.string(),
        score: z.number(),
        event: z.string(),
      })
    ),
  }),
  improvementTrend: z.object({
    topWins: z.array(
      z.object({
        issue: z.string(),
        resolvedOn: z.string(),
        scoreLift: z.number(),
      })
    ),
    consistency: z.enum(["consistent", "sporadic", "stalled"]),
    summary: z.string(),
  }),
  riskTrend: z.object({
    level: z.enum(["low", "medium", "high", "critical"]),
    persistentIssues: z.array(
      z.object({
        issue: z.string(),
        auditsSeen: z.number(),
        severity: z.enum(["high", "medium", "low"]),
      })
    ),
    newRisks: z.array(z.string()),
    summary: z.string(),
  }),
  nextActions: z.array(
    z.object({
      priority: z.enum(["urgent", "high", "medium"]),
      action: z.string(),
      rationale: z.string(),
      estimatedScoreLift: z.number(),
      effort: z.enum(["low", "medium", "high"]),
    })
  ),
  overallInsight: z.string(),
});

export type TrendAnalysis = z.infer<typeof trendAnalysisSchema>;

// ── Input types ───────────────────────────────────────────────────────────────

export interface AuditSnapshot {
  auditId: string;
  completedAt: string;
  overallScore: number;
  pagesCrawled: number;
  issuesFound: number;
  topIssues: Array<{ type: string; label: string; count: number; severity: string }>;
  scoreBreakdown: Array<{ category: string; score: number; issueCount: number }>;
}

// ── Parse helper (strips ```json fences) ──────────────────────────────────────

function parseJson<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return schema.parse(JSON.parse(cleaned));
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function analyzeTrends(
  siteUrl: string,
  snapshots: AuditSnapshot[]
): Promise<TrendAnalysis> {
  if (snapshots.length === 0) {
    throw new Error("No audit snapshots to analyze");
  }

  // Sort oldest → newest
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const auditSummaries = sorted
    .map((s, i) => {
      const date = new Date(s.completedAt).toISOString().slice(0, 10);
      const issues = s.topIssues
        .slice(0, 5)
        .map((t) => `${t.label} (×${t.count}, ${t.severity})`)
        .join("; ");
      const breakdown = s.scoreBreakdown
        .map((c) => `${c.category}:${c.score}`)
        .join(", ");
      return `Audit ${i + 1} [${date}]: score=${s.overallScore}, pages=${s.pagesCrawled}, totalIssues=${s.issuesFound}\n  Top issues: ${issues || "none"}\n  Breakdown: ${breakdown}`;
    })
    .join("\n\n");

  const prompt = `You are a senior SEO consultant analyzing audit history for ${siteUrl}.

Here are ${sorted.length} SEO audits in chronological order:

${auditSummaries}

Analyze the trends and return ONLY a JSON object (no markdown, no explanation) matching this exact structure:

{
  "scoreTrend": {
    "direction": "improving" | "declining" | "stable" | "volatile",
    "summary": "2-3 sentence narrative of score trajectory",
    "keyMilestones": [
      { "auditDate": "YYYY-MM-DD", "score": number, "event": "what changed or why notable" }
    ]
  },
  "improvementTrend": {
    "topWins": [
      { "issue": "issue type label", "resolvedOn": "YYYY-MM-DD", "scoreLift": estimated_points }
    ],
    "consistency": "consistent" | "sporadic" | "stalled",
    "summary": "2 sentence summary of improvement cadence"
  },
  "riskTrend": {
    "level": "low" | "medium" | "high" | "critical",
    "persistentIssues": [
      { "issue": "label", "auditsSeen": number_of_audits_this_appeared_in, "severity": "high" | "medium" | "low" }
    ],
    "newRisks": ["issue that appeared in the latest audit but not before"],
    "summary": "2 sentence risk assessment"
  },
  "nextActions": [
    {
      "priority": "urgent" | "high" | "medium",
      "action": "concrete specific action",
      "rationale": "why this matters based on the trend data",
      "estimatedScoreLift": number_between_1_and_20,
      "effort": "low" | "medium" | "high"
    }
  ],
  "overallInsight": "3-4 sentence executive summary for the website owner"
}

Rules:
- nextActions: 3-5 items, ordered by priority
- persistentIssues: only issues appearing in 2+ audits
- scoreLift estimates must be realistic (1-20 points total across all actions)
- Be specific and data-driven, reference actual scores and dates`;

  const { text } = await generateText({
    model: qwen(QWEN_MODEL),
    prompt,
    temperature: 0.3,
  });

  return parseJson(text, trendAnalysisSchema);
}
