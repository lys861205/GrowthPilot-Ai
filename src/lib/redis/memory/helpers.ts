import type { PageIssueRecord } from "@/lib/db/schema";

const ISSUE_LABELS: Record<string, string> = {
  missing_title:       "Missing title tag",
  title_too_short:     "Title too short",
  title_too_long:      "Title too long",
  missing_meta:        "Missing meta description",
  meta_too_short:      "Meta description too short",
  meta_too_long:       "Meta description too long",
  missing_h1:          "Missing H1",
  multiple_h1:         "Multiple H1 headings",
  no_h2:               "No H2 subheadings",
  thin_content:        "Thin content",
  low_word_count:      "Low word count",
  images_missing_alt:  "Images missing alt text",
  very_slow_page:      "Very slow page load",
  slow_page:           "Slow page load",
  no_internal_links:   "No internal links",
  noindex:             "Blocked from indexing",
  missing_canonical:   "Missing canonical tag",
  canonical_mismatch:  "Canonical URL mismatch",
  crawl_error:         "Crawl failure",
};

const CATEGORY_MAP: Record<string, string> = {
  missing_title:      "Title & Meta",
  title_too_short:    "Title & Meta",
  title_too_long:     "Title & Meta",
  missing_meta:       "Title & Meta",
  meta_too_short:     "Title & Meta",
  meta_too_long:      "Title & Meta",
  missing_canonical:  "Title & Meta",
  canonical_mismatch: "Title & Meta",
  missing_h1:         "Headings",
  multiple_h1:        "Headings",
  no_h2:              "Headings",
  thin_content:       "Content",
  low_word_count:     "Content",
  very_slow_page:     "Performance",
  slow_page:          "Performance",
  noindex:            "Indexability",
  crawl_error:        "Indexability",
  images_missing_alt: "Images & Links",
  no_internal_links:  "Images & Links",
};

type PageRow = { score: number; issues: PageIssueRecord[] | null };

export function buildTopIssuesFromPages(pageRows: PageRow[]) {
  const counts: Record<string, { count: number; severity: string }> = {};

  for (const page of pageRows) {
    for (const issue of page.issues ?? []) {
      if (!counts[issue.type]) {
        counts[issue.type] = { count: 0, severity: issue.severity };
      }
      counts[issue.type].count++;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([type, { count, severity }]) => ({
      type,
      label: ISSUE_LABELS[type] ?? type,
      count,
      severity,
    }));
}

export function buildScoreBreakdownFromPages(pageRows: PageRow[]) {
  const cats: Record<string, { issues: number; high: number }> = {
    "Title & Meta":   { issues: 0, high: 0 },
    "Headings":       { issues: 0, high: 0 },
    "Content":        { issues: 0, high: 0 },
    "Performance":    { issues: 0, high: 0 },
    "Indexability":   { issues: 0, high: 0 },
    "Images & Links": { issues: 0, high: 0 },
  };

  for (const page of pageRows) {
    for (const issue of page.issues ?? []) {
      const cat = CATEGORY_MAP[issue.type];
      if (cat && cats[cat]) {
        cats[cat].issues++;
        if (issue.severity === "high") cats[cat].high++;
      }
    }
  }

  return Object.entries(cats).map(([category, { issues, high }]) => ({
    category,
    score: Math.max(0, 100 - issues * 8 - high * 5),
    issueCount: issues,
  }));
}
