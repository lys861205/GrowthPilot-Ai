import { requireSession } from "@/lib/auth/session";
import { getBlogPostById, getSiteById } from "@/lib/db/queries";
import { notFound, redirect } from "next/navigation";
import { ContentEditor } from "@/components/content/ContentEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();

  const post = await getBlogPostById(id);
  if (!post) notFound();

  const site = await getSiteById(post.siteId, session.user.id);
  if (!site) redirect("/dashboard/content");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{post.title}</h1>
        <p className="mt-1 text-slate-500">
          {site.name} · {post.keywords && post.keywords.length > 0 && <span className="italic">"{post.keywords[0]}"</span>}
        </p>
      </div>
      <ContentEditor post={post} />
    </div>
  );
}
