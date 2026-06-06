import { db } from "@/lib/db";
import { memories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { MemoryContent } from "@/lib/db/schema";

interface SaveAuditMemoryParams {
  siteId: string;
  auditId: string;
  overallScore: number;
  pagesCrawled: number;
  issuesFound: number;
  topIssues: string[];
}

export async function saveAuditMemory(
  params: SaveAuditMemoryParams
): Promise<void> {
  const previous = await db.query.memories.findFirst({
    where: eq(memories.siteId, params.siteId),
    orderBy: desc(memories.createdAt),
  });

  const scoreChange =
    previous?.content?.overallScore !== undefined
      ? params.overallScore - previous.content.overallScore
      : undefined;

  const insights: string[] = [];

  if (scoreChange !== undefined) {
    if (scoreChange > 5) {
      insights.push(`Score improved by ${scoreChange} points since last audit`);
    } else if (scoreChange < -5) {
      insights.push(
        `Score dropped by ${Math.abs(scoreChange)} points — investigate regressions`
      );
    } else {
      insights.push("Score is stable compared to last audit");
    }
  }

  if (params.topIssues.length > 0) {
    insights.push(
      `Most common issues: ${params.topIssues.slice(0, 3).join(", ")}`
    );
  }

  const content: MemoryContent = {
    overallScore: params.overallScore,
    pagesCrawled: params.pagesCrawled,
    issuesFound: params.issuesFound,
    topIssues: params.topIssues,
    scoreChange,
    insights,
    summary: `Audit of ${params.pagesCrawled} pages. Score: ${params.overallScore}/100. ${params.issuesFound} issues found.`,
  };

  await db.insert(memories).values({
    siteId: params.siteId,
    auditId: params.auditId,
    type: "audit_summary",
    content,
  });
}

export async function loadSiteMemory(siteId: string): Promise<MemoryContent[]> {
  const records = await db.query.memories.findMany({
    where: eq(memories.siteId, siteId),
    orderBy: desc(memories.createdAt),
    limit: 5,
  });
  return records.map((r) => r.content);
}
