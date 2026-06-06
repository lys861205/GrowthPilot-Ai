import type {
  Audit,
  Site,
  Page,
  Suggestion,
  GrowthRecommendation,
  Memory,
} from "@/lib/db/schema";

export interface ScoreBreakdown {
  category: string;
  score: number;
  issueCount: number;
  highCount: number;
}

export interface IssueFrequency {
  type: string;
  label: string;
  count: number;
  severity: "high" | "medium" | "low";
}

export interface HistoricalPoint {
  auditId: string;
  score: number;
  pagesCrawled: number;
  issuesFound: number;
  completedAt: Date | null;
}

export type SuggestionWithPage = Suggestion & {
  page: { url: string; title: string | null } | null;
};

export interface OptimizedContentItem {
  pageUrl: string;
  pageTitle: string | null;
  before: string | null;
  after: string;
  type: "title" | "meta";
}

export interface AuditReport {
  audit: Audit;
  site: Site;
  pages: Page[];
  suggestions: SuggestionWithPage[];
  growthRecommendations: GrowthRecommendation[];
  memories: Memory[];

  // Computed
  scoreBreakdown: ScoreBreakdown[];
  topIssues: IssueFrequency[];
  history: HistoricalPoint[];
  insights: string[];
  scoreChange: number | null;

  // Groupings
  suggestionsByPriority: {
    high: SuggestionWithPage[];
    medium: SuggestionWithPage[];
    low: SuggestionWithPage[];
  };
  pagesByScore: Page[];
  optimizedContent: OptimizedContentItem[];
  issueCounts: { critical: number; warnings: number; passed: number };
}

// Re-export for convenience
export type { Audit, Site, Page, Suggestion, GrowthRecommendation, Memory };
