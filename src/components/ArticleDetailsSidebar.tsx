"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Article, Highlight } from "@/lib/supabase";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatLength(wordCount: number | null) {
  if (wordCount === null) return "—";
  return `${wordCount.toLocaleString()} words`;
}

function formatValue(value: string | null) {
  return value ?? "—";
}

type ArticleDetailsSidebarProps = {
  article: Article;
  highlights: Highlight[];
};

export default function ArticleDetailsSidebar({
  article,
  highlights,
}: ArticleDetailsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "highlights">("info");
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [readAt, setReadAt] = useState(article.read_at);
  const [markingRead, setMarkingRead] = useState(false);
  const [note, setNote] = useState(article.note ?? "");
  const [savedNote, setSavedNote] = useState(article.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const websiteLabel = article.source_domain ?? article.source_url;
  const highlightCount = highlights.length;
  const readStatusLabel = readStatus === "completed" ? "Completed" : "In progress";
  const noteIsDirty = note !== savedNote;

  useEffect(() => {
    const nextNote = article.note ?? "";
    setNote(nextNote);
    setSavedNote(nextNote);
  }, [article.id, article.note]);

  async function markAsRead() {
    if (markingRead || readStatus === "completed") return;
    setMarkingRead(true);
    const readAtValue = new Date().toISOString();
    const res = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read_status: "completed", read_at: readAtValue }),
    });

    if (res.ok) {
      setReadStatus("completed");
      setReadAt(readAtValue);
      router.refresh();
    }

    setMarkingRead(false);
  }

  async function saveNote() {
    if (savingNote || !noteIsDirty) return;
    setSavingNote(true);
    const trimmed = note.trim();
    const nextNote = trimmed.length > 0 ? note : "";
    const res = await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: trimmed.length > 0 ? note : null }),
    });

    if (res.ok) {
      setNote(nextNote);
      setSavedNote(nextNote);
      router.refresh();
    }

    setSavingNote(false);
  }

  return (
    <aside
      className={`shrink-0 transition-all duration-200 ${
        collapsed ? "w-12" : "w-full lg:w-72"
      }`}
    >
      <div className="sticky top-10">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            {!collapsed && (
              <div className="flex items-center gap-1 rounded-full bg-gray-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    activeTab === "info"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("highlights")}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    activeTab === "highlights"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Highlights
                  <span className="ml-1 text-[11px] text-gray-400">
                    {highlightCount}
                  </span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? "›" : "‹"}
            </button>
          </div>

          {!collapsed && activeTab === "info" && (
            <div className="p-4">
              <table className="w-full text-sm text-gray-600">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Title
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {article.title || "—"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Website
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {websiteLabel ? (
                        article.source_url ? (
                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {websiteLabel}
                          </a>
                        ) : (
                          websiteLabel
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Type
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {formatValue(article.type)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Domain
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {formatValue(article.source_domain)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Saved
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {formatDate(article.created_at)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-xs font-medium uppercase text-gray-400">
                      Length
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900">
                      {formatLength(article.word_count)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 align-top text-xs font-medium uppercase text-gray-400">
                      Read status
                    </td>
                    <td className="py-2 pl-4 text-right text-gray-900 align-top">
                      <div className="flex flex-col items-end gap-1.5">
                        <span>{readStatusLabel}</span>
                        {readStatus === "completed" && readAt && (
                          <span className="text-[11px] text-gray-400">
                            Read {formatDate(readAt)}
                          </span>
                        )}
                        {readStatus === "in_progress" && (
                          <button
                            type="button"
                            onClick={markAsRead}
                            disabled={markingRead}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {markingRead ? "Marking…" : "Mark as read"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!collapsed && activeTab === "highlights" && (
            <div className="p-4">
              <div className="mb-4">
                <div className="mb-2 text-xs font-medium uppercase text-gray-400">
                  Note
                </div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a note"
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={saveNote}
                    disabled={savingNote || !noteIsDirty}
                    className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingNote ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
              <div className="mb-3 text-xs font-medium uppercase text-gray-400">
                Highlights ({highlightCount})
              </div>
              {highlightCount === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : (
                <div className="space-y-2">
                  {highlights.map((highlight) => {
                    const label = highlight.text.trim() || "—";
                    return (
                      <button
                        key={highlight.id}
                        type="button"
                        onClick={() =>
                          router.push(`${pathname}?highlight=${highlight.id}`)
                        }
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 hover:border-gray-200 hover:bg-white transition-colors"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
