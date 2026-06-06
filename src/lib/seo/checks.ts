import type { CrawledPage } from "@/lib/crawler";
import type { PageIssueRecord } from "@/lib/db/schema";

export interface CheckResult {
  passed: boolean;
  score: number;      // 0-100 for this check
  weight: number;     // relative weight in overall score
  issues: PageIssueRecord[];
}

// ─── Individual checks ────────────────────────────────────────────────────────

export function checkTitle(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (!page.title) {
    issues.push({
      type: "missing_title",
      severity: "high",
      message: "Page is missing a <title> tag",
      detail: "Title tags are one of the most important on-page SEO factors.",
    });
    score = 0;
  } else if (page.title.length < 30) {
    issues.push({
      type: "title_too_short",
      severity: "medium",
      message: `Title is too short (${page.title.length} chars)`,
      detail: "Aim for 50–60 characters to maximise SERP display.",
    });
    score = 50;
  } else if (page.title.length > 60) {
    issues.push({
      type: "title_too_long",
      severity: "low",
      message: `Title may be truncated in SERPs (${page.title.length} chars)`,
      detail: "Keep titles under 60 characters.",
    });
    score = 75;
  }

  return { passed: issues.length === 0, score, weight: 20, issues };
}

export function checkMetaDescription(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (!page.metaDescription) {
    issues.push({
      type: "missing_meta",
      severity: "medium",
      message: "Page is missing a meta description",
      detail:
        "Meta descriptions improve click-through rates from search results.",
    });
    score = 0;
  } else if (page.metaDescription.length < 120) {
    issues.push({
      type: "meta_too_short",
      severity: "low",
      message: `Meta description is too short (${page.metaDescription.length} chars)`,
      detail: "Aim for 120–160 characters.",
    });
    score = 60;
  } else if (page.metaDescription.length > 160) {
    issues.push({
      type: "meta_too_long",
      severity: "low",
      message: `Meta description may be truncated (${page.metaDescription.length} chars)`,
      detail: "Keep meta descriptions under 160 characters.",
    });
    score = 75;
  }

  return { passed: issues.length === 0, score, weight: 15, issues };
}

export function checkHeadings(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (page.h1Tags.length === 0) {
    issues.push({
      type: "missing_h1",
      severity: "high",
      message: "Page has no H1 heading",
      detail: "Every page should have exactly one H1 tag.",
    });
    score -= 60;
  } else if (page.h1Tags.length > 1) {
    issues.push({
      type: "multiple_h1",
      severity: "medium",
      message: `Page has ${page.h1Tags.length} H1 headings`,
      detail: "Use only one H1 per page for clear content hierarchy.",
    });
    score -= 30;
  }

  if (page.h2Tags.length === 0 && page.wordCount > 300) {
    issues.push({
      type: "no_h2",
      severity: "low",
      message: "Long page has no H2 subheadings",
      detail: "Break up content with H2 subheadings for readability and SEO.",
    });
    score -= 15;
  }

  return {
    passed: issues.length === 0,
    score: Math.max(0, score),
    weight: 15,
    issues,
  };
}

export function checkContent(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (page.wordCount < 100) {
    issues.push({
      type: "thin_content",
      severity: "high",
      message: `Page has very thin content (${page.wordCount} words)`,
      detail:
        "Search engines prefer pages with at least 300 words of quality content.",
    });
    score = 20;
  } else if (page.wordCount < 300) {
    issues.push({
      type: "low_word_count",
      severity: "medium",
      message: `Page has low word count (${page.wordCount} words)`,
      detail: "Consider expanding content to at least 300 words.",
    });
    score = 60;
  }

  return { passed: issues.length === 0, score, weight: 10, issues };
}

export function checkImages(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (page.imagesWithoutAlt > 0) {
    const severity = page.imagesWithoutAlt > 3 ? "high" : "medium";
    issues.push({
      type: "images_missing_alt",
      severity,
      message: `${page.imagesWithoutAlt} image${page.imagesWithoutAlt > 1 ? "s" : ""} missing alt text`,
      detail: "Alt text is critical for accessibility and image SEO.",
    });
    score = Math.max(0, 100 - page.imagesWithoutAlt * 15);
  }

  return { passed: issues.length === 0, score, weight: 10, issues };
}

export function checkPageSpeed(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (page.loadTimeMs !== null && page.loadTimeMs !== undefined) {
    if (page.loadTimeMs > 5000) {
      issues.push({
        type: "very_slow_page",
        severity: "high",
        message: `Page loaded in ${(page.loadTimeMs / 1000).toFixed(1)}s`,
        detail: "Pages over 5 seconds have high abandonment rates. Aim for under 2s.",
      });
      score = 20;
    } else if (page.loadTimeMs > 3000) {
      issues.push({
        type: "slow_page",
        severity: "medium",
        message: `Page loaded in ${(page.loadTimeMs / 1000).toFixed(1)}s`,
        detail: "Pages over 3 seconds see significant ranking penalties. Aim for under 2s.",
      });
      score = 55;
    } else if (page.loadTimeMs > 2000) {
      issues.push({
        type: "moderate_load_time",
        severity: "low",
        message: `Page loaded in ${(page.loadTimeMs / 1000).toFixed(1)}s`,
        detail: "Consider optimising assets to get below 2 seconds.",
      });
      score = 75;
    }
  }

  return { passed: issues.length === 0, score, weight: 15, issues };
}

export function checkInternalLinks(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (page.internalLinks.length === 0 && page.wordCount > 200) {
    issues.push({
      type: "no_internal_links",
      severity: "medium",
      message: "Page has no internal links",
      detail: "Internal links help distribute PageRank and improve crawlability.",
    });
    score = 40;
  } else if (page.internalLinks.length < 2 && page.wordCount > 500) {
    issues.push({
      type: "few_internal_links",
      severity: "low",
      message: `Page has only ${page.internalLinks.length} internal link(s)`,
      detail: "Add more internal links to improve site structure.",
    });
    score = 70;
  }

  return { passed: issues.length === 0, score, weight: 5, issues };
}

export function checkIndexability(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (!page.isIndexable) {
    issues.push({
      type: "noindex",
      severity: "high",
      message: "Page is blocked from indexing (noindex)",
      detail: `Robots meta: "${page.robotsMeta}". If this page should rank, remove the noindex directive.`,
    });
    score = 0;
  }

  if (page.statusCode >= 400 && page.statusCode < 500) {
    issues.push({
      type: "client_error",
      severity: "high",
      message: `Page returned HTTP ${page.statusCode}`,
      detail: "4xx errors prevent indexing. Fix or remove the page.",
    });
    score = 0;
  } else if (page.statusCode >= 500) {
    issues.push({
      type: "server_error",
      severity: "high",
      message: `Page returned HTTP ${page.statusCode}`,
      detail: "5xx errors indicate server problems that block crawling.",
    });
    score = 0;
  }

  return { passed: issues.length === 0, score, weight: 5, issues };
}

export function checkCanonical(page: CrawledPage): CheckResult {
  const issues: PageIssueRecord[] = [];
  let score = 100;

  if (!page.canonicalUrl) {
    issues.push({
      type: "missing_canonical",
      severity: "low",
      message: "Page is missing a canonical URL tag",
      detail:
        "Canonical tags prevent duplicate content issues. Add <link rel=\"canonical\" href=\"...\">.",
    });
    score = 70;
  } else {
    try {
      const canonical = new URL(page.canonicalUrl);
      const current = new URL(page.url);
      if (canonical.href !== current.href) {
        issues.push({
          type: "canonical_mismatch",
          severity: "medium",
          message: "Canonical URL differs from current page URL",
          detail: `Canonical: ${page.canonicalUrl} — Current: ${page.url}`,
        });
        score = 50;
      }
    } catch {
      issues.push({
        type: "invalid_canonical",
        severity: "low",
        message: "Canonical URL is malformed",
        detail: `Value: "${page.canonicalUrl}"`,
      });
      score = 60;
    }
  }

  return { passed: issues.length === 0, score, weight: 5, issues };
}

export function checkCrawlError(page: CrawledPage): CheckResult {
  if (!page.error) {
    return { passed: true, score: 100, weight: 0, issues: [] };
  }

  return {
    passed: false,
    score: 0,
    weight: 0,
    issues: [
      {
        type: "crawl_error",
        severity: "high",
        message: `Failed to crawl page: ${page.error}`,
        detail: "The page could not be fetched during the audit.",
      },
    ],
  };
}
