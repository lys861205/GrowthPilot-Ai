import { streamText, generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";
import { slugify } from "@/lib/utils";

export interface BlogPostRequest {
  topic: string;
  keywords: string[];
  tone: "professional" | "conversational" | "educational";
  wordCount: 600 | 900 | 1200;
  siteUrl: string;
  siteName?: string;
}

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  keywords: string[];
  seoScore: number;
  wordCount: number;
}

const outlineSchema = z.object({
  title: z.string().max(70),
  metaDescription: z.string().max(160),
  excerpt: z.string().max(200),
  slug: z.string().max(80),
  sections: z.array(
    z.object({
      heading: z.string(),
      keyPoints: z.array(z.string()).max(4),
    })
  ).min(3).max(6),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).max(5),
});

export type BlogOutline = z.infer<typeof outlineSchema>;

export async function generateBlogOutline(
  req: BlogPostRequest
): Promise<BlogOutline> {
  const { text } = await generateText({
    model: qwen(QWEN_MODEL),
    prompt: `You are an expert SEO content strategist for e-commerce websites.

Create a detailed blog post outline for the following request:

Site: ${req.siteUrl}${req.siteName ? ` (${req.siteName})` : ""}
Topic: ${req.topic}
Target keywords: ${req.keywords.length > 0 ? req.keywords.join(", ") : "derive from topic"}
Tone: ${req.tone}
Target word count: ~${req.wordCount} words

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "title": "compelling title including primary keyword (max 70 chars)",
  "metaDescription": "120-160 char meta description",
  "excerpt": "1-2 sentence hook (max 200 chars)",
  "slug": "url-friendly-slug",
  "sections": [
    { "heading": "H2 heading", "keyPoints": ["point 1", "point 2"] }
  ],
  "primaryKeyword": "main keyword",
  "secondaryKeywords": ["kw1", "kw2"]
}

Requirements: 3-6 sections, each with 2-4 key points. Output JSON only.`,
  });

  // Strip markdown code fences if model wraps the JSON
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = outlineSchema.parse(JSON.parse(cleaned));
  parsed.slug = slugify(parsed.slug || parsed.title);
  return parsed;
}

export async function streamBlogPost(
  outline: BlogOutline,
  req: BlogPostRequest
) {
  const sectionsPrompt = outline.sections
    .map(
      (s, i) =>
        `## ${s.heading}\nKey points to cover:\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}`
    )
    .join("\n\n");

  return streamText({
    model: qwen(QWEN_MODEL),
    prompt: `You are an expert e-commerce content writer. Write a complete, SEO-optimised blog post based on this outline.

Title: ${outline.title}
Primary keyword: "${outline.primaryKeyword}"
Secondary keywords: ${outline.secondaryKeywords.join(", ")}
Tone: ${req.tone}
Target length: ~${req.wordCount} words
Site: ${req.siteUrl}

Outline:
${sectionsPrompt}

Writing requirements:
1. Start with a compelling introduction (2-3 paragraphs) that hooks the reader and includes the primary keyword naturally in the first 100 words
2. Write each section in full, following the key points provided
3. Use the primary keyword 3-5 times naturally throughout (avoid keyword stuffing)
4. Include the secondary keywords where they fit naturally
5. Write in ${req.tone} tone appropriate for an e-commerce audience
6. End with a clear call-to-action paragraph
7. Format output as clean Markdown with proper heading hierarchy (## for H2, ### for H3)
8. Do NOT include the title (H1) in the output — the title is handled separately
9. Aim for exactly ~${req.wordCount} words

Write the full blog post now:`,
  });
}

export function scoreBlogPost(content: string, keywords: string[]): number {
  if (!content) return 0;

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const lines = content.split("\n");

  let score = 0;

  // Word count (25 points)
  if (wordCount >= 1000) score += 25;
  else if (wordCount >= 700) score += 20;
  else if (wordCount >= 400) score += 12;
  else score += 5;

  // Has H2 headings (15 points)
  const h2Count = lines.filter((l) => l.startsWith("## ")).length;
  if (h2Count >= 3) score += 15;
  else if (h2Count >= 2) score += 10;
  else if (h2Count >= 1) score += 5;

  // Keywords present (30 points)
  if (keywords.length > 0) {
    const contentLower = content.toLowerCase();
    const found = keywords.filter((kw) =>
      contentLower.includes(kw.toLowerCase())
    ).length;
    score += Math.round((found / keywords.length) * 30);
  } else {
    score += 15; // neutral when no keywords specified
  }

  // Has introduction and conclusion pattern (15 points)
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("introduction") || wordCount > 100) score += 7;
  if (
    lowerContent.includes("conclusion") ||
    lowerContent.includes("summary") ||
    lowerContent.includes("final") ||
    lowerContent.includes("remember")
  )
    score += 8;

  // Has internal-link friendly anchor text pattern (15 points)
  if (content.includes("[") && content.includes("](")) score += 15;
  else if (wordCount > 500) score += 7;

  return Math.min(100, score);
}

export function extractWordCount(markdown: string): number {
  // Strip markdown syntax before counting
  const stripped = markdown
    .replace(/#+\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\s*[-*+]\s/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.split(" ").filter(Boolean).length;
}
