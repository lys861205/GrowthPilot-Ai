export type Platform = "shopify" | "wordpress" | "other";

export type AuditStatus = "pending" | "running" | "done" | "failed";

export type IssueSeverity = "high" | "medium" | "low";

export type SuggestionType =
  | "title"
  | "meta"
  | "content"
  | "speed"
  | "structure"
  | "image";

export type Priority = "high" | "medium" | "low";

export type ContentStatus = "draft" | "published";

export type GrowthCategory = "seo" | "content" | "technical" | "ux";

export type MemoryType = "audit_summary" | "trend" | "insight";

export interface PageIssue {
  type: string;
  severity: IssueSeverity;
  message: string;
  detail?: string;
}

export interface AuditStreamEvent {
  type:
    | "start"
    | "page_crawled"
    | "page_analyzed"
    | "suggestions_generated"
    | "growth_generated"
    | "complete"
    | "error";
  message: string;
  data?: Record<string, unknown>;
  progress?: number;
}

export interface SeoScore {
  overall: number;
  title: number;
  meta: number;
  headings: number;
  content: number;
  links: number;
  images: number;
  performance: number;
}
