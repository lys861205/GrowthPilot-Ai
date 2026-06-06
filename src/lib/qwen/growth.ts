import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";
import { db } from "@/lib/db";
import { growthRecommendations } from "@/lib/db/schema";
import type { PageAnalysisResult } from "@/lib/seo/scorer";

interface GrowthContext {
  siteId: string;
  auditId: string;
  siteUrl: string;
  overallScore: number;
  pageResults: PageAnalysisResult[];
  totalIssues: number;
}

const growthSchema = z.object({
  recommendations: z.array(
    z.object({
      category: z.enum(["seo", "content", "technical", "ux"]),
      title: z.string().max(120),
      description: z.string().max(400),
      impact: z.enum(["high", "medium", "low"]),
      effort: z.enum(["high", "medium", "low"]),
    })
  ),
});

export async function generateGrowthRecommendations(
  ctx: GrowthContext
): Promise<void> {
  const issueBreakdown = summariseIssues(ctx.pageResults);
  const worstPages = ctx.pageResults
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((p) => `${p.url} (score: ${p.score}, issues: ${p.issueCount})`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: qwen(QWEN_MODEL),
      prompt: `You are a growth advisor for e-commerce stores. Analyse this SEO audit and provide strategic growth recommendations.

Site: ${ctx.siteUrl}
Overall SEO score: ${ctx.overallScore}/100
Pages crawled: ${ctx.pageResults.length}
Total issues found: ${ctx.totalIssues}

Worst performing pages:
${worstPages}

Issue breakdown:
${issueBreakdown}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "recommendations": [
    {
      "category": "seo|content|technical|ux",
      "title": "recommendation title (max 80 chars)",
      "description": "actionable description (max 300 chars)",
      "impact": "high|medium|low",
      "effort": "high|medium|low"
    }
  ]
}

Generate 4-6 recommendations. Prioritise quick wins (high impact, low effort) first. Include at least one content and one technical recommendation. Output JSON only.`,
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = growthSchema.parse(JSON.parse(cleaned));

    if (parsed.recommendations.length > 0) {
      await db.insert(growthRecommendations).values(
        parsed.recommendations.map((r) => ({
          siteId: ctx.siteId,
          auditId: ctx.auditId,
          category: r.category,
          title: r.title,
          description: r.description,
          impact: r.impact,
          effort: r.effort,
        }))
      );
    }
  } catch (err) {
    console.error("[growth] Failed to generate recommendations:", err);
  }
}

function summariseIssues(pages: PageAnalysisResult[]): string {
  const counts: Record<string, number> = {};
  for (const page of pages) {
    for (const issue of page.issues) {
      counts[issue.type] = (counts[issue.type] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => `- ${type}: ${count} page(s)`)
    .join("\n");
}
