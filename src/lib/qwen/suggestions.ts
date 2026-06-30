import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";
import type { PageIssueRecord, NewSuggestion } from "@/lib/db/schema";
import type { UserContext } from "@/lib/redis/memory/keys";

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

function buildMemoryContext(memory: UserContext | null): string {
  if (!memory || Number(memory.totalAudits) < 2) return "";

  const lines: string[] = ["## Site Memory (from previous audits)"];

  if (memory.totalAudits)
    lines.push(`- Total audits run: ${memory.totalAudits}`);
  if (memory.lastAuditScore)
    lines.push(`- Last audit score: ${memory.lastAuditScore}/100`);
  if (memory.bestScore)
    lines.push(`- Best score ever: ${memory.bestScore}/100`);
  if (memory.avgScoreChange)
    lines.push(`- Avg score change per audit: ${memory.avgScoreChange} pts`);
  if (memory.topPersistentIssue)
    lines.push(
      `- Most persistent issue across audits: ${memory.topPersistentIssue} — prioritise fixing this`
    );

  lines.push(
    "Use this history to avoid repeating suggestions already given in past audits, and to focus on issues that have persisted across multiple runs."
  );

  return lines.join("\n");
}

export async function generateSuggestions(
  pages: PageContext[],
  auditId: string,
  memory: UserContext | null = null
): Promise<NewSuggestion[]> {
  const pagesWithIssues = pages
    .filter((p) => p.issues.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const memoryContext = buildMemoryContext(memory);
  const allSuggestions: NewSuggestion[] = [];

  for (const page of pagesWithIssues) {
    try {
      const issueList = page.issues
        .map(
          (i) =>
            `- [${i.severity.toUpperCase()}] ${i.message}${i.detail ? `: ${i.detail}` : ""}`
        )
        .join("\n");

      const { text } = await generateText({
        model: qwen(QWEN_MODEL),
        prompt: `You are an expert SEO consultant analysing a page for an e-commerce store.
${memoryContext ? `\n${memoryContext}\n` : ""}
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

      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
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
