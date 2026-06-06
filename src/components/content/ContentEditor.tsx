"use client";

import { useEffect, useState } from "react";
import { useContentStream } from "@/hooks/useContentStream";
import { saveBlogContentAction, updatePostStatusAction, deleteBlogPostAction } from "@/lib/content/actions";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Save, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/db/schema";

interface ContentEditorProps {
  post: BlogPost;
}

export function ContentEditor({ post }: ContentEditorProps) {
  const [body, setBody] = useState(post.content ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const { content, isStreaming, isDone, error: streamError, wordCount, seoScore, stream, reset } = useContentStream();

  // Auto-fill editor when stream completes
  useEffect(() => {
    if (isDone && content) {
      setBody(content);
      saveBlogContentAction(post.id, content).catch(console.error);
    }
  }, [isDone, content, post.id]);

  async function handleSave() {
    setSaving(true);
    await saveBlogContentAction(post.id, body);
    setSaving(false);
    router.refresh();
  }

  async function handlePublish() {
    await updatePostStatusAction(post.id, "published");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    await deleteBlogPostAction(post.id);
    router.push("/dashboard/content");
  }

  const displayContent = isStreaming ? content : body;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {!isStreaming && !isDone && !post.content && (
          <button
            onClick={() => stream({ postId: post.id })}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Generate Content
          </button>
        )}
        {isStreaming && (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Writing…
          </div>
        )}
        {(isDone || post.content) && !isStreaming && (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            {post.status !== "published" && (
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Publish
              </button>
            )}
            <button
              onClick={() => { reset(); stream({ postId: post.id }); }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </button>
          </>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
      </div>

      {streamError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">Stream error: {streamError}</p>
      )}

      {/* Stats bar */}
      {(wordCount > 0 || seoScore !== null || post.wordCount) && (
        <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
          <span>{(isStreaming ? wordCount : post.wordCount) ?? 0} words</span>
          {(isStreaming ? seoScore : post.seoScore) !== null && (
            <span>SEO score: <strong>{isStreaming ? seoScore : post.seoScore}</strong>/100</span>
          )}
          <span className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            post.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
          )}>
            {post.status}
          </span>
        </div>
      )}

      {/* Editor */}
      <textarea
        value={displayContent}
        onChange={(e) => !isStreaming && setBody(e.target.value)}
        readOnly={isStreaming}
        placeholder={isStreaming ? "Writing…" : "Content will appear here. Click 'Generate Content' to start."}
        className={cn(
          "w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 font-mono leading-relaxed resize-none focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
          isStreaming && "bg-slate-50 cursor-wait"
        )}
        rows={30}
      />
    </div>
  );
}
