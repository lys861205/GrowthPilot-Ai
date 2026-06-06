import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";
import type { PageIssueRecord, NewSuggestion } from "@/lib/db/schema";

interface PageContext {
  pageId: string;
  url: string;
  score: number;
  issues: PageIssueRecord[];
  title: string | null;
  metaDescription: string | null;
}

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.enum(["title", "meta", "content", "speed", "structure", "image"]),
      priority: z.enum(["high", "medium", "low"]),
      title: z.string().max(120),
      body: z.string().max(600),
    })
  ),
});

export async function generateSuggestions(
  pages: PageContext[],
  auditId: string
): Promise<NewSuggestion[]> {
  const pagesWithIssues = pages
    .filter((p) => p.issues.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const allSuggestions: NewSuggestion[] = [];

  for (const page of pagesWithIssues) {
    try {
      const issueList = page.issues
        .map((i) => `- [${i.severity.toUpperCase()}] ${i.message}${i.detail ? `: ${i.detail}` : ""}`)
        .join("\n");

      const { text } = await generateText({
        model: qwen(QWEN_MODEL),
        prompt: `You are an expert SEO consultant analysing a page for an e-commerce store.

Page URL: ${page.url}
Current SEO score: ${page.score}/100
Title: ${page.title ?? "(missing)"}
Meta description: ${page.metaDescription ?? "(missing)"}

Issues detected:
${issueList}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "suggestions": [
    {
      "type": "title|meta|content|speed|structure|image",
      "priority": "high|medium|low",
      "title": "concise suggestion title (max 80 chars)",
      "body": "specific actionable fix with example (max 400 chars)"
    }
  ]
}

Generate 2-4 suggestions addressing the listed issues. Output JSON only.`,
      });

      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = suggestionSchema.parse(JSON.parse(cleaned));

      for (const s of parsed.suggestions) {
        allSuggestions.push({
          auditId,
          pageId: page.pageId,
          type: s.type,
          priority: s.priority,
          title: s.title,
          body: s.body,
        });
      }
    } catch (err) {
      console.error(`[suggestions] Failed for ${page.url}:`, err);
    }
  }

  return allSuggestions;
}
