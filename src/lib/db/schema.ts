import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  pgEnum,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const platformEnum = pgEnum("platform", [
  "shopify",
  "wordpress",
  "other",
]);

export const auditStatusEnum = pgEnum("audit_status", [
  "pending",
  "running",
  "done",
  "failed",
]);

export const issueSeverityEnum = pgEnum("issue_severity", [
  "high",
  "medium",
  "low",
]);

export const suggestionTypeEnum = pgEnum("suggestion_type", [
  "title",
  "meta",
  "content",
  "speed",
  "structure",
  "image",
]);

export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
]);

export const growthCategoryEnum = pgEnum("growth_category", [
  "seo",
  "content",
  "technical",
  "ux",
]);

export const memoryTypeEnum = pgEnum("memory_type", [
  "audit_summary",
  "trend",
  "insight",
]);

// ─── Users (better-auth compatible) ──────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Sites ────────────────────────────────────────────────────────────────────

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    name: text("name").notNull(),
    platform: platformEnum("platform").default("other"),
    faviconUrl: text("favicon_url"),
    companyInfo: text("company_info"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("sites_user_id_idx").on(t.userId)]
);

// ─── Audits ───────────────────────────────────────────────────────────────────

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    status: auditStatusEnum("status").notNull().default("pending"),
    overallScore: integer("overall_score"),
    pagesCrawled: integer("pages_crawled").notNull().default(0),
    issuesFound: integer("issues_found").notNull().default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audits_site_id_idx").on(t.siteId)]
);

// ─── Pages ────────────────────────────────────────────────────────────────────

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    metaDescription: text("meta_description"),
    h1Count: integer("h1_count").notNull().default(0),
    h2Count: integer("h2_count").notNull().default(0),
    wordCount: integer("word_count").notNull().default(0),
    internalLinks: integer("internal_links").notNull().default(0),
    externalLinks: integer("external_links").notNull().default(0),
    imagesWithoutAlt: integer("images_without_alt").notNull().default(0),
    loadTimeMs: integer("load_time_ms"),
    statusCode: integer("status_code"),
    score: integer("score").notNull().default(0),
    issues: jsonb("issues").$type<PageIssueRecord[]>().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("pages_audit_id_idx").on(t.auditId)]
);

// ─── Suggestions ──────────────────────────────────────────────────────────────

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => pages.id, {
      onDelete: "cascade",
    }),
    type: suggestionTypeEnum("type").notNull(),
    priority: priorityEnum("priority").notNull().default("medium"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    applied: boolean("applied").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("suggestions_audit_id_idx").on(t.auditId),
    index("suggestions_page_id_idx").on(t.pageId),
  ]
);

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content"),
    excerpt: text("excerpt"),
    keywords: text("keywords").array().default([]),
    status: contentStatusEnum("status").notNull().default("draft"),
    seoScore: integer("seo_score"),
    wordCount: integer("word_count"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("blog_posts_site_id_idx").on(t.siteId)]
);

// ─── Growth Recommendations ───────────────────────────────────────────────────

export const growthRecommendations = pgTable(
  "growth_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => audits.id, {
      onDelete: "set null",
    }),
    category: growthCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    impact: priorityEnum("impact").notNull().default("medium"),
    effort: priorityEnum("effort").notNull().default("medium"),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("growth_recommendations_site_id_idx").on(t.siteId)]
);

// ─── Memories ─────────────────────────────────────────────────────────────────

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => audits.id, {
      onDelete: "set null",
    }),
    type: memoryTypeEnum("type").notNull(),
    content: jsonb("content").$type<MemoryContent>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("memories_site_id_idx").on(t.siteId),
    index("memories_type_idx").on(t.type),
  ]
);

// ─── Blog Agent Jobs (background task tracking) ───────────────────────────────

export const blogAgentStatusEnum = pgEnum("blog_agent_status", [
  "pending",
  "running",
  "done",
  "failed",
]);

export const blogAgentJobs = pgTable(
  "blog_agent_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => audits.id, { onDelete: "set null" }),
    status: blogAgentStatusEnum("status").notNull().default("pending"),
    ideasGenerated: integer("ideas_generated"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("blog_agent_jobs_site_id_idx").on(t.siteId)]
);

// ─── Blog Ideas (Blog Agent output) ──────────────────────────────────────────

export const blogIdeas = pgTable(
  "blog_ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id").references(() => audits.id, { onDelete: "set null" }),
    // Core fields
    topic: text("topic").notNull(),
    primaryKeyword: text("primary_keyword").notNull(),
    secondaryKeywords: jsonb("secondary_keywords").$type<string[]>().default([]),
    intent: text("intent").notNull(), // informational | commercial | transactional
    priority: priorityEnum("priority").notNull().default("medium"),
    priorityReason: text("priority_reason"),
    // Titles
    titles: jsonb("titles").$type<string[]>().default([]),
    recommendedTitle: text("recommended_title"),
    // Outline
    outline: jsonb("outline").$type<BlogIdeaOutline>(),
    estimatedWordCount: integer("estimated_word_count"),
    // FAQ
    faq: jsonb("faq").$type<BlogFaqItem[]>().default([]),
    // Meta suggestion
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    // Internal links suggested
    internalLinks: jsonb("internal_links").$type<BlogInternalLink[]>().default([]),
    // Status
    convertedToPostId: uuid("converted_to_post_id").references(() => blogPosts.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("blog_ideas_site_id_idx").on(t.siteId),
    index("blog_ideas_audit_id_idx").on(t.auditId),
  ]
);

// ─── Google Search Console ────────────────────────────────────────────────────

export const gscAccounts = pgTable("gsc_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  googleAccountId: text("google_account_id"),
  email: text("email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gscProperties = pgTable("gsc_properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  gscAccountId: uuid("gsc_account_id")
    .notNull()
    .references(() => gscAccounts.id, { onDelete: "cascade" }),
  propertyUrl: text("property_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gscDailyMetrics = pgTable("gsc_daily_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => gscProperties.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  query: text("query"),
  page: text("page"),
  clicks: integer("clicks").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  ctr: real("ctr"),
  position: real("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("gsc_metrics_property_id_idx").on(t.propertyId),
  index("gsc_metrics_date_idx").on(t.date),
]);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  sites: many(sites),
  gscAccounts: many(gscAccounts),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  user: one(users, { fields: [sites.userId], references: [users.id] }),
  audits: many(audits),
  blogPosts: many(blogPosts),
  growthRecommendations: many(growthRecommendations),
  memories: many(memories),
  blogIdeas: many(blogIdeas),
  blogAgentJobs: many(blogAgentJobs),
  gscProperties: many(gscProperties),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  site: one(sites, { fields: [audits.siteId], references: [sites.id] }),
  pages: many(pages),
  suggestions: many(suggestions),
  growthRecommendations: many(growthRecommendations),
  memories: many(memories),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  audit: one(audits, { fields: [pages.auditId], references: [audits.id] }),
  suggestions: many(suggestions),
}));

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  audit: one(audits, {
    fields: [suggestions.auditId],
    references: [audits.id],
  }),
  page: one(pages, { fields: [suggestions.pageId], references: [pages.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  site: one(sites, { fields: [blogPosts.siteId], references: [sites.id] }),
}));

export const growthRecommendationsRelations = relations(
  growthRecommendations,
  ({ one }) => ({
    site: one(sites, {
      fields: [growthRecommendations.siteId],
      references: [sites.id],
    }),
    audit: one(audits, {
      fields: [growthRecommendations.auditId],
      references: [audits.id],
    }),
  })
);

export const memoriesRelations = relations(memories, ({ one }) => ({
  site: one(sites, { fields: [memories.siteId], references: [sites.id] }),
  audit: one(audits, { fields: [memories.auditId], references: [audits.id] }),
}));

export const blogAgentJobsRelations = relations(blogAgentJobs, ({ one }) => ({
  site: one(sites, { fields: [blogAgentJobs.siteId], references: [sites.id] }),
  audit: one(audits, { fields: [blogAgentJobs.auditId], references: [audits.id] }),
}));

export const blogIdeasRelations = relations(blogIdeas, ({ one }) => ({
  site: one(sites, { fields: [blogIdeas.siteId], references: [sites.id] }),
  audit: one(audits, { fields: [blogIdeas.auditId], references: [audits.id] }),
  convertedPost: one(blogPosts, { fields: [blogIdeas.convertedToPostId], references: [blogPosts.id] }),
}));

export const gscAccountsRelations = relations(gscAccounts, ({ one, many }) => ({
  user: one(users, { fields: [gscAccounts.userId], references: [users.id] }),
  properties: many(gscProperties),
}));

export const gscPropertiesRelations = relations(gscProperties, ({ one, many }) => ({
  site: one(sites, { fields: [gscProperties.siteId], references: [sites.id] }),
  account: one(gscAccounts, { fields: [gscProperties.gscAccountId], references: [gscAccounts.id] }),
  metrics: many(gscDailyMetrics),
}));

export const gscDailyMetricsRelations = relations(gscDailyMetrics, ({ one }) => ({
  property: one(gscProperties, { fields: [gscDailyMetrics.propertyId], references: [gscProperties.id] }),
}));

// ─── JSON column types ────────────────────────────────────────────────────────

export interface BlogIdeaOutlineSection {
  h2: string;
  targetWords: number;
  subsections: { h3: string }[];
}

export interface BlogIdeaOutline {
  sections: BlogIdeaOutlineSection[];
}

export interface BlogFaqItem {
  question: string;
  answer: string;
  intent: string;
}

export interface BlogInternalLink {
  anchorText: string;
  targetUrl: string;
  suggestedSection: string;
}

export interface PageIssueRecord {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  detail?: string;
}

export interface MemoryContent {
  overallScore?: number;
  pagesCrawled?: number;
  issuesFound?: number;
  topIssues?: string[];
  scoreChange?: number;
  insights?: string[];
  summary?: string;
}

// ─── Inferred types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type Suggestion = typeof suggestions.$inferSelect;
export type NewSuggestion = typeof suggestions.$inferInsert;

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export type GrowthRecommendation = typeof growthRecommendations.$inferSelect;
export type NewGrowthRecommendation =
  typeof growthRecommendations.$inferInsert;

export type Memory = typeof memories.$inferSelect;

export type BlogAgentJob = typeof blogAgentJobs.$inferSelect;
export type NewBlogAgentJob = typeof blogAgentJobs.$inferInsert;

export type BlogIdea = typeof blogIdeas.$inferSelect;
export type NewBlogIdea = typeof blogIdeas.$inferInsert;
export type NewMemory = typeof memories.$inferInsert;

export type GscAccount = typeof gscAccounts.$inferSelect;
export type NewGscAccount = typeof gscAccounts.$inferInsert;

export type GscProperty = typeof gscProperties.$inferSelect;
export type NewGscProperty = typeof gscProperties.$inferInsert;

export type GscDailyMetric = typeof gscDailyMetrics.$inferSelect;
export type NewGscDailyMetric = typeof gscDailyMetrics.$inferInsert;
