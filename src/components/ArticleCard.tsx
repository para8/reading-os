"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/supabase";
import TagEditor from "./TagEditor";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readTime(wordCount: number | null) {
  if (!wordCount) return null;
  return `~${Math.max(1, Math.ceil(wordCount / 200))} min`;
}

export default function ArticleCard({
  article,
}: {
  article: Pick<
    Article,
    | "id"
    | "title"
    | "source_domain"
    | "created_at"
    | "word_count"
    | "type"
    | "source_tags"
    | "theme_tags"
  >;
}) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      setDeleteError("Failed to delete article. Please try again.");
      return;
    }
    setIsDeleted(true);
    setShowDelete(false);
    setDeleting(false);
    router.refresh();
  }

  if (isDeleted) return null;

  return (
    <article className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        title="Delete article"
        aria-label="Delete article"
        onClick={() => {
          setDeleteError(null);
          setShowDelete(true);
        }}
        className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 4h6m-7 3h8m-1 0-.9 11a2 2 0 0 1-2 1.8H9.9a2 2 0 0 1-2-1.8L7 7m4 4v6m2-6v6"
          />
        </svg>
      </button>
      <Link href={`/read/${article.id}`} className="group block">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 leading-snug">
          {article.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-400">
          {article.source_domain && (
            <span className="text-gray-500">{article.source_domain}</span>
          )}
          {article.source_domain && <span>·</span>}
          <span>{formatDate(article.created_at)}</span>
          {readTime(article.word_count) && (
            <>
              <span>·</span>
              <span>{readTime(article.word_count)}</span>
            </>
          )}
        </div>
      </Link>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Source & theme
        </div>
        <div className="space-y-1">
          <TagEditor
            articleId={article.id}
            initialTags={article.source_tags}
            label="source"
          />
          <TagEditor
            articleId={article.id}
            initialTags={article.theme_tags}
            label="theme"
          />
        </div>
      </div>
      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete this article?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This removes the article from your library.
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
