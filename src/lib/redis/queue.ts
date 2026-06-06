import { Queue, Worker, type Job } from "bullmq";

// BullMQ bundles its own ioredis — pass a plain connection config, not a
// Redis instance, to avoid a dual-ioredis type mismatch at compile time.
const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
  maxRetriesPerRequest: null as unknown as number,
  enableReadyCheck: false,
};

export interface AuditJobData {
  auditId: string;
  siteId: string;
  siteUrl: string;
  userId: string;
}

export interface AuditJobResult {
  auditId: string;
  overallScore: number;
  pagesCrawled: number;
  issuesFound: number;
}

const QUEUE_NAME = "audit-queue";

export const auditQueue = new Queue<AuditJobData, AuditJobResult>(
  QUEUE_NAME,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  }
);

export function createAuditWorker(
  processor: (job: Job<AuditJobData, AuditJobResult>) => Promise<AuditJobResult>
) {
  return new Worker<AuditJobData, AuditJobResult>(QUEUE_NAME, processor, {
    connection,
    concurrency: 3,
  });
}

export const STREAM_KEY = (auditId: string) => `audit:stream:${auditId}`;
export const STREAM_TTL = 60 * 60;

// ─── Blog Agent Queue ─────────────────────────────────────────────────────────

export interface BlogAgentJobData {
  jobId: string;   // blog_agent_jobs.id
  siteId: string;
  auditId: string | null;
  userId: string;
}

export interface BlogAgentJobResult {
  jobId: string;
  ideasGenerated: number;
}

const BLOG_AGENT_QUEUE = "blog-agent-queue";

export const blogAgentQueue = new Queue<BlogAgentJobData, BlogAgentJobResult>(
  BLOG_AGENT_QUEUE,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
    },
  }
);

export function createBlogAgentWorker(
  processor: (job: Job<BlogAgentJobData, BlogAgentJobResult>) => Promise<BlogAgentJobResult>
) {
  return new Worker<BlogAgentJobData, BlogAgentJobResult>(BLOG_AGENT_QUEUE, processor, {
    connection,
    concurrency: 2,
  });
}
