import { requireSession } from "@/lib/auth/session";
import { getSitesByUserId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { audits, blogIdeas, blogAgentJobs } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { BlogAgentForm } from "@/components/blog-agent/BlogAgentForm";
import { BlogAgentProgress } from "@/components/blog-agent/BlogAgentProgress";
import { BlogIdeaCard } from "@/components/blog-agent/BlogIdeaCard";
import { Sparkles, BookOpen, Target, TrendingUp } from "lucide-react";

interface Props {
  searchParams: Promise<{ siteId?: string; jobId?: string }>;
}

export default async function BlogAgentPage({ searchParams }: Props) {
  const { siteId, jobId } = await searchParams;
  const session = await requireSession();
  const sites = await getSitesByUserId(session.user.id);

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No sites found</p>
          <p className="mt-1 text-sm text-slate-500">Add a site and run an audit first.</p>
        </div>
      </div>
    );
  }

  // Load all audits for user's sites
  const siteIds = sites.map((s) => s.id);
  const allAudits = siteIds.length > 0
    ? await db.query.audits.findMany({
        where: and(
          inArray(audits.siteId, siteIds),
          eq(audits.status, "done")
        ),
        orderBy: desc(audits.createdAt),
        columns: { id: true, siteId: true, overallScore: true, createdAt: true },
      })
    : [];

  // Active site
  const activeSiteId = siteId ?? sites[0].id;

  // Query across ALL user sites for any active job — so navigating away and back always shows progress
  const latestJob = siteIds.length > 0
    ? await db.query.blogAgentJobs.findFirst({
        where: inArray(blogAgentJobs.siteId, siteIds),
        orderBy: desc(blogAgentJobs.createdAt),
        columns: { id: true, status: true, siteId: true },
      })
    : null;
  const activeJob = latestJob && (latestJob.status === "pending" || latestJob.status === "running")
    ? latestJob
    : null;
  const ideas = await db.query.blogIdeas.findMany({
    where: eq(blogIdeas.siteId, activeSiteId),
    orderBy: [desc(blogIdeas.createdAt)],
  });

  // Stats
  const highCount = ideas.filter((i) => i.priority === "high").length;
  const withFaq = ideas.filter((i) => (i.faq as unknown[])?.length > 0).length;
  const converted = ideas.filter((i) => i.convertedToPostId).length;

  return (
    <div className="space-y-8">
      <PageHeader />

      {/* ── Full-width progress banner (shown when job is active) ── */}
      {activeJob && (
        <BlogAgentProgress jobId={activeJob.id} siteId={activeJob.siteId} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form (always visible) */}
        <div className="lg:col-span-1 space-y-4">
          <BlogAgentForm
            sites={sites}
            audits={allAudits}
            defaultSiteId={activeSiteId}
            disabled={!!activeJob}
          />

          {/* Stats */}
          {ideas.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Results</p>
              <StatRow icon={Target} label="Blog Ideas" value={ideas.length} color="indigo" />
              <StatRow icon={TrendingUp} label="High Priority" value={highCount} color="red" />
              <StatRow icon={BookOpen} label="With FAQs" value={withFaq} color="blue" />
              <StatRow icon={Sparkles} label="Posts Created" value={converted} color="green" />
            </div>
          )}
        </div>

        {/* Right: Ideas list */}
        <div className="lg:col-span-2 space-y-4">
          {activeJob && ideas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-indigo-300 mb-3 animate-pulse" />
              <p className="font-semibold text-indigo-600">Generating your blog ideas…</p>
              <p className="mt-1 text-sm text-indigo-400">
                Results will appear here automatically when ready.
              </p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">No ideas yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Select a site and click "Generate Blog Ideas" to start.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {ideas.length} Blog Ideas Generated
                </h2>
                <span className="text-xs text-slate-400">Click any card to expand</span>
              </div>
              {ideas.map((idea, i) => (
                <BlogIdeaCard key={idea.id} idea={idea} index={i} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Blog Agent</h1>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">AI</span>
      </div>
      <p className="text-slate-500">
        Generate 10 SEO-optimized blog ideas from your audit — complete with outlines, keywords, and FAQ sections.
      </p>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "indigo" | "red" | "blue" | "green";
}) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50",
    red: "text-red-500 bg-red-50",
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-600 bg-green-50",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-1.5 ${colors[color]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
