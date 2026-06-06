import type { CrawledPage } from "@/lib/crawler";
import type { PageIssueRecord } from "@/lib/db/schema";
import {
  checkTitle,
  checkMetaDescription,
  checkHeadings,
  checkContent,
  checkImages,
  checkPageSpeed,
  checkInternalLinks,
  checkIndexability,
  checkCanonical,
  checkCrawlError,
} from "./checks";

export interface PageAnalysisResult {
  url: string;
  score: number;
  issues: PageIssueRecord[];
  issueCount: number;
  highSeverityCount: number;
}

export interface SiteAnalysisResult {
  overallScore: number;
  pageResults: PageAnalysisResult[];
  totalIssues: number;
}

export function analyzePage(page: CrawledPage): PageAnalysisResult {
  const crawlCheck = checkCrawlError(page);

  if (!crawlCheck.passed) {
    return {
      url: page.url,
      score: 0,
      issues: crawlCheck.issues,
      issueCount: crawlCheck.issues.length,
      highSeverityCount: 1,
    };
  }

  const checkResults = [
    checkTitle(page),
    checkMetaDescription(page),
    checkHeadings(page),
    checkContent(page),
    checkImages(page),
    checkPageSpeed(page),
    checkInternalLinks(page),
    checkIndexability(page),
    checkCanonical(page),
  ];

  const totalWeight = checkResults.reduce((sum, r) => sum + r.weight, 0);
  const weightedScore = checkResults.reduce(
    (sum, r) => sum + r.score * r.weight,
    0
  );

  const score =
    totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100;

  const allIssues = checkResults.flatMap((r) => r.issues);
  const highSeverityCount = allIssues.filter(
    (i) => i.severity === "high"
  ).length;

  return {
    url: page.url,
    score,
    issues: allIssues,
    issueCount: allIssues.length,
    highSeverityCount,
  };
}

export function analyzeSite(pages: CrawledPage[]): SiteAnalysisResult {
  const pageResults = pages.map(analyzePage);

  const overallScore =
    pageResults.length > 0
      ? Math.round(
          pageResults.reduce((sum, p) => sum + p.score, 0) / pageResults.length
        )
      : 0;

  const totalIssues = pageResults.reduce((sum, p) => sum + p.issueCount, 0);

  return { overallScore, pageResults, totalIssues };
}
