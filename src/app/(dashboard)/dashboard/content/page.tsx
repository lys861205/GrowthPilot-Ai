import { requireSession } from "@/lib/auth/session";
import { getSitesByUserId, getBlogPostsBySiteId } from "@/lib/db/queries";
import { GenerateContentForm } from "@/components/content/GenerateContentForm";
import { FileText, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export default async function ContentPage() {
  const session = await requireSession();
  const siteList = await getSitesByUserId(session.user.id);

  const allPosts = await Promise.all(siteList.map((s) => getBlogPostsBySiteId(s.id)));
  const posts = allPosts
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const siteMap = Object.fromEntries(siteList.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content AI</h1>
        <p className="mt-1 text-slate-500">Generate SEO-optimised blog posts with AI.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Generate New Post</h2>
        <GenerateContentForm sites={siteList} />
      </section>

      {posts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Posts</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center gap-4 px-5 py-4">
                <div className="rounded-lg bg-indigo-50 p-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{post.title}</p>
                  <p className="text-xs text-slate-400">{siteMap[post.siteId]?.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {post.wordCount ? ` · ${post.wordCount} words` : ""}
                    {post.seoScore ? ` · SEO score ${post.seoScore}` : ""}
                  </p>
                </div>
                <Link
                  href={`/dashboard/content/${post.id}`}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
