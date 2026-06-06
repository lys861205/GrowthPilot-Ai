import { generateText } from "ai";
import { z } from "zod";
import { qwen, QWEN_MODEL } from "./client";
import type {
  BlogIdeaOutline,
  BlogFaqItem,
  BlogInternalLink,
} from "@/lib/db/schema";

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface BlogAgentInput {
  siteUrl: string;
  siteName: string;
  auditScore: number;
  pagesCrawled: number;
  topIssues: Array<{ label: string; count: number; severity: string }>;
  pageTitles: string[];       // crawled page titles for internal link suggestions
  pageUrls: string[];         // crawled page URLs
  niche?: string;             // optional user hint
}

export interface BlogIdeaResult {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: "informational" | "commercial" | "transactional";
  priority: "high" | "medium" | "low";
  priorityReason: string;
  titles: string[];
  recommendedTitle: string;
  outline: BlogIdeaOutline;
  estimatedWordCount: number;
  faq: BlogFaqItem[];
  metaTitle: string;
  metaDescription: string;
  internalLinks: BlogInternalLink[];
}

export interface BlogAgentResult {
  niche: string;
  targetAudience: string;
  keywordClusters: Array<{
    cluster: string;
    intent: string;
    exampleKeywords: string[];
  }>;
  ideas: BlogIdeaResult[];
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const siteContextSchema = z.object({
  niche: z.string(),
  targetAudience: z.string(),
  keywordClusters: z.array(
    z.object({
      cluster: z.string(),
      intent: z.string(),
      exampleKeywords: z.array(z.string()),
    })
  ),
});

const outlineSectionSchema = z.object({
  h2: z.string(),
  targetWords: z.number(),
  subsections: z.array(z.object({ h3: z.string() })),
});

const blogIdeaSchema = z.object({
  topic: z.string(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  intent: z.enum(["informational", "commercial", "transactional"]),
  priority: z.enum(["high", "medium", "low"]),
  priorityReason: z.string(),
  titles: z.array(z.string()).min(2),
  recommendedTitle: z.string(),
  outline: z.object({ sections: z.array(outlineSectionSchema) }),
  estimatedWordCount: z.number(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  internalLinks: z.array(
    z.object({
      anchorText: z.string(),
      targetUrl: z.string(),
      suggestedSection: z.string(),
    })
  ),
});

const ideasSchema = z.object({
  ideas: z.array(blogIdeaSchema),
});

const faqSchema = z.object({
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      intent: z.string(),
    })
  ),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseJson<T>(text: string, schema: z.ZodType<T>): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return schema.parse(JSON.parse(cleaned));
}

async function callQwen(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: qwen(QWEN_MODEL),
    prompt,
  });
  return text;
}

// ─── Call 1: Site Intelligence + Keyword Gap Analysis ────────────────────────

async function analyzeSiteContext(input: BlogAgentInput): Promise<z.infer<typeof siteContextSchema>> {
  const issueList = input.topIssues
    .map((i) => `- ${i.label}: ${i.count} pages [${i.severity}]`)
    .join("\n");

  const existingTitles = input.pageTitles.slice(0, 15).join("\n");

  const prompt = `You are an expert SEO strategist specializing in e-commerce and SaaS content.

Analyze the site context and SEO audit data below to identify content gaps.

Site URL: ${input.siteUrl}
Site Name: ${input.siteName}
${input.niche ? `Industry hint: ${input.niche}` : ""}
Overall SEO Score: ${input.auditScore}/100
Pages Crawled: ${input.pagesCrawled}

Top SEO Issues:
${issueList}

Existing Page Titles (for context, do not replicate these):
${existingTitles}

Tasks:
1. Identify the site niche and primary target audience (1-2 sentences each)
2. Generate 5 semantic keyword clusters this site should rank for but currently has no content addressing
3. For each cluster specify dominant search intent: informational | commercial | transactional

Return ONLY valid JSON (no markdown, no explanation):
{
  "niche": "string",
  "targetAudience": "string",
  "keywordClusters": [
    {
      "cluster": "string",
      "intent": "informational|commercial|transactional",
      "exampleKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

  const text = await callQwen(prompt);
  return parseJson(text, siteContextSchema);
}

// ─── Call 2: Blog Ideas + Titles + Outlines ───────────────────────────────────

async function generateBlogIdeas(
  input: BlogAgentInput,
  context: z.infer<typeof siteContextSchema>
): Promise<z.infer<typeof ideasSchema>> {
  const clusters = context.keywordClusters
    .map((c) => `- ${c.cluster} [${c.intent}]: ${c.exampleKeywords.join(", ")}`)
    .join("\n");

  const existingPages = input.pageUrls
    .slice(0, 10)
    .map((url, i) => `${url} (${input.pageTitles[i] ?? "untitled"})`)
    .join("\n");

  const prompt = `You are a senior SEO content strategist generating high-impact blog posts.

Site: ${input.siteUrl}
Niche: ${context.niche}
Target Audience: ${context.targetAudience}
SEO Score: ${input.auditScore}/100

Keyword clusters to target:
${clusters}

Existing pages for internal linking:
${existingPages}

Generate exactly 10 blog post ideas. For each:
- Choose a primary long-tail keyword from one of the clusters
- Set priority (high/medium/low) based on how much it can fix the site's thin content issues
- Explain priorityReason in one sentence tied to the audit data
- Provide 3 unique title variants targeting different SERP angles
- Recommend the best title
- Write a complete H2/H3 outline with word count targets per section
- Suggest 1-2 internal links to existing pages
- Total estimated word count: 800-1400 words per post

Return ONLY valid JSON (no markdown, no explanation):
{
  "ideas": [
    {
      "topic": "string",
      "primaryKeyword": "string",
      "secondaryKeywords": ["string"],
      "intent": "informational|commercial|transactional",
      "priority": "high|medium|low",
      "priorityReason": "string",
      "titles": ["title1", "title2", "title3"],
      "recommendedTitle": "string",
      "outline": {
        "sections": [
          {
            "h2": "string",
            "targetWords": 200,
            "subsections": [{ "h3": "string" }]
          }
        ]
      },
      "estimatedWordCount": 1000,
      "metaTitle": "string (50-60 chars)",
      "metaDescription": "string (120-155 chars)",
      "internalLinks": [
        {
          "anchorText": "string",
          "targetUrl": "string",
          "suggestedSection": "string"
        }
      ]
    }
  ]
}`;

  const text = await callQwen(prompt);
  return parseJson(text, ideasSchema);
}

// ─── Call 3: FAQ Generation ───────────────────────────────────────────────────

async function generateFaqs(
  idea: z.infer<typeof blogIdeaSchema>,
  context: z.infer<typeof siteContextSchema>
): Promise<BlogFaqItem[]> {
  const prompt = `You are an SEO specialist capturing Google's "People Also Ask" and featured snippets.

Blog topic: ${idea.topic}
Primary keyword: "${idea.primaryKeyword}"
Target audience: ${context.targetAudience}

Generate 6 FAQ questions a user searching for "${idea.primaryKeyword}" would ask.
Rules for answers:
- Answer directly in the FIRST sentence (no preamble)
- 40-60 words per answer
- No "learn more" or redirects — complete standalone answers
- Mix beginner (3) and intermediate (3) questions
- Include both the primary keyword and secondary keywords naturally

Return ONLY valid JSON (no markdown):
{
  "faq": [
    {
      "question": "string",
      "answer": "string",
      "intent": "informational|commercial|transactional"
    }
  ]
}`;

  const text = await callQwen(prompt);
  const parsed = parseJson(text, faqSchema);
  return parsed.faq;
}

// ─── Main Agent ───────────────────────────────────────────────────────────────

export async function runBlogAgent(input: BlogAgentInput): Promise<BlogAgentResult> {
  // Call 1: understand the site
  const context = await analyzeSiteContext(input);

  // Call 2: generate all 10 ideas with outlines (one call for efficiency)
  const { ideas: rawIdeas } = await generateBlogIdeas(input, context);

  // Call 3: generate FAQs for top-5 priority ideas in parallel
  const topIdeas = [...rawIdeas]
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, 5);

  const faqResults = await Promise.all(
    topIdeas.map((idea) => generateFaqs(idea, context).catch(() => [] as BlogFaqItem[]))
  );

  // Merge FAQs into ideas
  const ideasWithFaq: BlogIdeaResult[] = rawIdeas.map((idea) => {
    const topIdx = topIdeas.findIndex((t) => t.primaryKeyword === idea.primaryKeyword);
    return {
      ...idea,
      faq: topIdx >= 0 ? faqResults[topIdx] : [],
    };
  });

  return {
    niche: context.niche,
    targetAudience: context.targetAudience,
    keywordClusters: context.keywordClusters,
    ideas: ideasWithFaq,
  };
}
