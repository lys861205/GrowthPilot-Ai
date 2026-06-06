import * as cheerio from "cheerio";

export interface CrawledPage {
  url: string;
  statusCode: number;
  loadTimeMs: number | null;
  title: string | null;
  metaDescription: string | null;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  imagesWithoutAlt: number;
  canonicalUrl: string | null;
  robotsMeta: string | null;
  isIndexable: boolean;
  error: string | null;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_PAGES = 15;

const CRAWL_HEADERS = {
  "User-Agent":
    "GrowthPilotBot/1.0 (+https://growthpilot.ai/bot; SEO audit crawler)",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function crawlSite(
  rootUrl: string,
  onPageCrawled?: (page: CrawledPage, index: number, total: number) => void
): Promise<CrawledPage[]> {
  const base = normalizeUrl(rootUrl);
  const visited = new Set<string>();
  const queue: string[] = [base];
  const results: CrawledPage[] = [];

  while (queue.length > 0 && results.length < MAX_PAGES) {
    const url = queue.shift()!;
    const normalized = normalizeUrl(url);

    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const page = await crawlPage(normalized, base);
    results.push(page);

    onPageCrawled?.(page, results.length - 1, Math.min(queue.length + results.length, MAX_PAGES));

    if (!page.error && page.statusCode < 400) {
      for (const link of page.internalLinks) {
        const norm = normalizeUrl(link);
        if (!visited.has(norm) && isSameDomain(norm, base)) {
          queue.push(norm);
        }
      }
    }
  }

  return results;
}

export async function crawlPage(
  url: string,
  baseUrl: string
): Promise<CrawledPage> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: CRAWL_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timer);
    const loadTimeMs = Date.now() - start;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return emptyPage(url, response.status, loadTimeMs, "Non-HTML content");
    }

    const html = await response.text();
    return parsePage(html, url, baseUrl, response.status, loadTimeMs);
  } catch (err) {
    const loadTimeMs = Date.now() - start;
    const error =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Request timed out"
          : err.message
        : "Unknown error";
    return emptyPage(url, 0, loadTimeMs, error);
  }
}

function parsePage(
  html: string,
  url: string,
  baseUrl: string,
  statusCode: number,
  loadTimeMs: number
): CrawledPage {
  const $ = cheerio.load(html);

  // Remove non-content elements before counting words
  $("script, style, noscript, nav, footer, header").remove();

  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? null;

  const h1Tags = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2Tags = $("h2")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;

  const canonicalUrl =
    $('link[rel="canonical"]').attr("href")?.trim() ?? null;
  const robotsMeta =
    $('meta[name="robots"]').attr("content")?.trim() ?? null;
  const isIndexable = robotsMeta
    ? !robotsMeta.toLowerCase().includes("noindex")
    : true;

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    try {
      const resolved = new URL(href, url).href.split("#")[0];
      if (isSameDomain(resolved, baseUrl)) {
        if (!internalLinks.includes(resolved)) internalLinks.push(resolved);
      } else {
        if (!externalLinks.includes(resolved)) externalLinks.push(resolved);
      }
    } catch {
      // Malformed href — skip
    }
  });

  let imagesWithoutAlt = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null || alt.trim() === "") {
      imagesWithoutAlt++;
    }
  });

  return {
    url,
    statusCode,
    loadTimeMs,
    title,
    metaDescription,
    h1Tags,
    h2Tags,
    wordCount,
    internalLinks: internalLinks.slice(0, 30),
    externalLinks: externalLinks.slice(0, 20),
    imagesWithoutAlt,
    canonicalUrl,
    robotsMeta,
    isIndexable,
    error: null,
  };
}

function emptyPage(
  url: string,
  statusCode: number,
  loadTimeMs: number,
  error: string
): CrawledPage {
  return {
    url,
    statusCode,
    loadTimeMs: loadTimeMs as number | null,
    title: null,
    metaDescription: null,
    h1Tags: [],
    h2Tags: [],
    wordCount: 0,
    internalLinks: [],
    externalLinks: [],
    imagesWithoutAlt: 0,
    canonicalUrl: null,
    robotsMeta: null,
    isIndexable: false,
    error,
  };
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip trailing slash except for root
    let pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return url;
  }
}

function isSameDomain(url: string, base: string): boolean {
  try {
    return new URL(url).hostname === new URL(base).hostname;
  } catch {
    return false;
  }
}
