import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";

// ── Schema ────────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string(),
  reason: z.string(),
  expectedImpact: z.string(),
  estimatedEffort: z.enum(["low", "medium", "high"]),
  scoreLift: z.number().min(0).max(20),
  category: z.enum(["content", "technical", "on-page", "links", "performance"]),
});

const daySchema = z.object({
  day: z.number().min(1).max(7),
  focus: z.string(),
  tasks: z.array(taskSchema).min(1).max(3),
});

export const actionPlanSchema = z.object({
  siteUrl: z.string(),
  generatedAt: z.string(),
  totalEstimatedScoreLift: z.number(),
  weekFocus: z.string(),
  days: z.array(daySchema).length(7),
});

export type ActionPlan = z.infer<typeof actionPlanSchema>;
export type DayPlan = z.infer<typeof daySchema>;
export type ActionTask = z.infer<typeof taskSchema>;

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ActionPlanContext {
  siteUrl: string;
  latestScore: number;
  pagesCrawled: number;
  issuesFound: number;
  topIssues: Array<{ label: string; count: number; severity: string }>;
  scoreBreakdown: Array<{ category: string; score: number; issueCount: number }>;
  // optional history context
  scoreTrend?: "improving" | "declining" | "stable" | "volatile";
  previousScore?: number;
  persistentIssues?: string[];
}

// ── Parse helper ──────────────────────────────────────────────────────────────

function parseJson<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return schema.parse(JSON.parse(cleaned));
}

// ── Generator ─────────────────────────────────────────────────────────────────

export async function generateActionPlan(
  ctx: ActionPlanContext
): Promise<ActionPlan> {
  const issueList = ctx.topIssues
    .map((i) => `- ${i.label} (×${i.count} pages, severity: ${i.severity})`)
    .join("\n");

  const breakdownList = ctx.scoreBreakdown
    .map((c) => `- ${c.category}: ${c.score}/100 (${c.issueCount} issues)`)
    .join("\n");

  const historyCtx = ctx.scoreTrend
    ? `\nScore trend: ${ctx.scoreTrend}. Previous score: ${ctx.previousScore ?? "unknown"}.${
        ctx.persistentIssues?.length
          ? `\nPersistent issues (unresolved across multiple audits): ${ctx.persistentIssues.join(", ")}.`
          : ""
      }`
    : "";

  const prompt = `You are an expert SEO growth agent. Create a prioritized 7-day action plan for ${ctx.siteUrl}.

Current SEO score: ${ctx.latestScore}/100
Pages crawled: ${ctx.pagesCrawled}
Total issues: ${ctx.issuesFound}
${historyCtx}

Top issues:
${issueList}

Score breakdown by category:
${breakdownList}

Rules:
- Day 1-2: Quick wins (low effort, high impact) — things that can be fixed today
- Day 3-4: On-page improvements and content fixes
- Day 5-6: Technical or structural improvements
- Day 7: Review, verify fixes, and plan next sprint
- Each day has 1-3 tasks max (be realistic about what 1 person can do in a day)
- Prioritize issues that appear on the most pages
- Persistent issues (appearing in multiple audits) are urgent

Return ONLY a JSON object with this exact structure (no markdown, no explanation):

{
  "siteUrl": "${ctx.siteUrl}",
  "generatedAt": "${new Date().toISOString()}",
  "totalEstimatedScoreLift": <sum of all scoreLift values, integer>,
  "weekFocus": "<one sentence describing the overall theme of this week's work>",
  "days": [
    {
      "day": 1,
      "focus": "<short label for the day's theme, e.g. 'Quick Wins'>",
      "tasks": [
        {
          "title": "<concrete actionable task title>",
          "reason": "<why this specific task, referencing the audit data>",
          "expectedImpact": "<specific outcome, e.g. 'Fix meta descriptions on 8 pages'>",
          "estimatedEffort": "low" | "medium" | "high",
          "scoreLift": <integer 1-20>,
          "category": "content" | "technical" | "on-page" | "links" | "performance"
        }
      ]
    },
    ... (7 days total)
  ]
}`;

  const { text } = await generateText({
    model: qwen(QWEN_MODEL),
    prompt,
    temperature: 0.4,
  });

  return parseJson(text, actionPlanSchema);
}
