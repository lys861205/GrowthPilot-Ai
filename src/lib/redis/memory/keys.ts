// ─── Redis key schema ─────────────────────────────────────────────────────────
// All TTLs in seconds

export const TTL = {
  SCORE_HISTORY:    30 * 24 * 3600, // 30 days
  AUDIT_SNAPSHOT:    7 * 24 * 3600, // 7 days
  COMPARE_CACHE:          3600,     // 1 hour
  RECS_LATEST:       7 * 24 * 3600, // 7 days
  BLOG_INDEX:       30 * 24 * 3600, // 30 days
  USER_CONTEXT:     90 * 24 * 3600, // 90 days
} as const;

// Sorted set — members are JSON score-point objects, scored by timestamp
export const K = {
  scoreHistory:   (siteId: string) => `score:history:${siteId}`,
  auditSnapshot:  (auditId: string) => `audit:snapshot:${auditId}`,
  compareCache:   (a: string, b: string) => {
    // Canonical order so compare(A,B) === compare(B,A)
    const [x, y] = [a, b].sort();
    return `compare:${x}:${y}`;
  },
  recsLatest:     (siteId: string) => `recs:latest:${siteId}`,
  blogIndex:      (siteId: string) => `blog:index:${siteId}`,
  userContext:    (userId: string, siteId: string) => `memory:ctx:${userId}:${siteId}`,
} as const;

// ─── Payload types ────────────────────────────────────────────────────────────

export interface ScorePoint {
  auditId: string;
  score: number;
  pagesCrawled: number;
  issuesFound: number;
  completedAt: string; // ISO
}

export interface AuditSnapshot {
  auditId: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  overallScore: number;
  pagesCrawled: number;
  issuesFound: number;
  completedAt: string;
  topIssues: Array<{ type: string; label: string; count: number; severity: string }>;
  scoreBreakdown: Array<{ category: string; score: number; issueCount: number }>;
}

export interface RecsSnapshot {
  auditId: string;
  capturedAt: string;
  items: Array<{
    category: string;
    title: string;
    impact: string;
    effort: string;
  }>;
}

export interface BlogIndexEntry {
  postId: string;
  title: string;
  slug: string;
  primaryKeyword: string;
  seoScore: number | null;
  wordCount: number | null;
  status: string;
  auditId: string | null;
  createdAt: string;
}

export interface UserContext {
  lastAuditId: string;
  lastAuditScore: string;
  bestScore: string;
  worstScore: string;
  totalAudits: string;
  avgScoreChange: string;
  topPersistentIssue: string;
  lastBlogGenAt: string;
  totalBlogPosts: string;
}

export interface CompareResult {
  auditIdA: string;
  auditIdB: string;
  scoreDelta: number;
  trend: "improving" | "declining" | "stable";
  resolvedIssues: string[];
  newIssues: string[];
  persistentIssues: string[];
  categoryChanges: Record<string, { before: number; after: number; delta: number }>;
  pagesDelta: number;
  issuesDelta: number;
  blogsBetween: number;
  summary: string;
  generatedAt: string;
}
