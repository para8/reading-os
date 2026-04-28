"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Article, Highlight } from "@/lib/supabase";
import {
  getSelectionOffsets,
  applyHighlightMarks,
  clearHighlightMarks,
} from "@/lib/highlight-utils";

interface ArticleContentProps {
  article: Article;
  initialHighlights: Highlight[];
  focusHighlightId?: string;
}

function textToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((para) => {
      const escaped = para
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<p>${escaped}</p>`;
    })
    .join("");
}

export default function ArticleContent({
  article,
  initialHighlights,
  focusHighlightId,
}: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const originalHtmlRef = useRef<string | null>(null);
  // Stores the pending highlight data without touching React state
  const pendingRef = useRef<{ start: number; end: number; text: string } | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("lg");
  const [isMobile, setIsMobile] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [showHighlightsSheet, setShowHighlightsSheet] = useState(false);
  const [note, setNote] = useState(article.note ?? "");
  const [savedNote, setSavedNote] = useState(article.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const noteIsDirty = note !== savedNote;

  // Both article types use dangerouslySetInnerHTML so React never reconciles
  // the article children — manually-added <mark> elements survive re-renders.
  const baseHtml = useMemo(
    () =>
      isHtmlArticle(article)
        ? article.content_html!
        : textToHtml(article.content_text || ""),
    [article]
  );

  // Capture the clean HTML after React sets it via dangerouslySetInnerHTML.
  useEffect(() => {
    if (containerRef.current) {
      originalHtmlRef.current = containerRef.current.innerHTML;
    }
  }, [article]);

  useEffect(() => {
    const nextNote = article.note ?? "";
    setNote(nextNote);
    setSavedNote(nextNote);
  }, [article.id, article.note]);

  useEffect(() => {
    setHighlights(initialHighlights);
  }, [initialHighlights]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (!isMobile && highlightMode) {
      setHighlightMode(false);
    }
  }, [isMobile, highlightMode]);

  const sortedHighlights = useMemo(() => {
    return [...highlights].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [highlights]);

  // Re-apply all marks whenever the highlight list changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || originalHtmlRef.current === null) return;

    clearHighlightMarks(container);
    const markMap = applyHighlightMarks(container, highlights);

    if (focusHighlightId) {
      const el = markMap.get(focusHighlightId);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-yellow-400");
          setTimeout(() => el.classList.remove("ring-2", "ring-yellow-400"), 2000);
        });
      }
    }
  }, [highlights, article, focusHighlightId, isMobile, highlightMode]);

  // Show/hide the tooltip via direct DOM manipulation so there is NO React
  // re-render — a re-render is what was clearing the browser text selection.
  const showTooltip = useCallback((x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = "";
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = "none";
    pendingRef.current = null;
    selectionRef.current = null;
  }, []);

  const handleSelectionEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (tooltipRef.current?.contains(e.target as Node)) return;
      if (isMobile && !highlightMode) {
        hideTooltip();
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        hideTooltip();
        return;
      }
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        hideTooltip();
        return;
      }
      const offsets = getSelectionOffsets(container, sel);
      if (!offsets) {
        hideTooltip();
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      pendingRef.current = offsets;
      selectionRef.current = range.cloneRange();
      requestAnimationFrame(() => {
        showTooltip(
          rect.left + rect.width / 2 - containerRect.left,
          rect.top - containerRect.top - 8
        );
        const restored = selectionRef.current;
        if (restored) {
          const current = window.getSelection();
          if (current) {
            current.removeAllRanges();
            current.addRange(restored);
          }
        }
      });
    },
    [showTooltip, hideTooltip, isMobile, highlightMode]
  );

  const handleSelectionStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (tooltipRef.current?.contains(e.target as Node)) return;
      hideTooltip();
    },
    [hideTooltip]
  );

  const handleHighlightClick = useCallback(async (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest(
      "button[data-delete-highlight-id]"
    ) as HTMLButtonElement | null;
    if (!btn) return;
    const id = btn.dataset.deleteHighlightId!;
    const res = await fetch(`/api/highlights/${id}`, { method: "DELETE" });
    if (res.ok) {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    }
  }, []);

  async function confirmHighlight() {
    const pending = pendingRef.current;
    if (!pending || saving) return;

    hideTooltip();
    window.getSelection()?.removeAllRanges();

    setSaving(true);
    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: article.id,
        text: pending.text,
        start_offset: pending.start,
        end_offset: pending.end,
      }),
    });

    if (res.ok) {
      const created: Highlight = await res.json();
      setHighlights((prev) => [...prev, created]);
    }
    setSaving(false);
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

  function toggleHighlightMode() {
    const next = !highlightMode;
    if (!next) {
      hideTooltip();
      window.getSelection()?.removeAllRanges();
    }
    setHighlightMode(next);
  }

  return (
    <div
      className="relative"
      onMouseUp={handleSelectionEnd}
      onMouseDown={handleSelectionStart}
      onTouchEnd={handleSelectionEnd}
      onTouchStart={handleSelectionStart}
      onClick={handleHighlightClick}
    >
      {isMobile && highlightMode ? (
        <div className="fixed left-0 right-0 top-0 z-30 bg-gray-900 text-white text-xs font-semibold px-4 py-2 text-center">
          Highlight mode
        </div>
      ) : null}

      {isMobile ? (
        <div className="fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
          <button
            type="button"
            onClick={toggleHighlightMode}
            aria-pressed={highlightMode}
            aria-label={highlightMode ? "Exit highlight mode" : "Enter highlight mode"}
            className={`rounded-full p-2 shadow-lg transition-colors ${
              highlightMode
                ? "bg-yellow-200 text-yellow-900"
                : "bg-gray-900 text-white"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowNoteSheet(true)}
            aria-label="Add note"
            className="rounded-full bg-gray-900 p-2 text-white shadow-lg transition-colors hover:bg-gray-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
              <path d="M9 7h6" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowHighlightsSheet(true)}
            aria-label="View highlights"
            className="rounded-full bg-gray-900 p-2 text-white shadow-lg transition-colors hover:bg-gray-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
        <span className="font-medium text-gray-400">Text size</span>
        <div className="flex items-center gap-2">
          {(
            [
              { label: "Small", value: "sm" },
              { label: "Normal", value: "base" },
              { label: "Large", value: "lg" },
              { label: "Extra large", value: "xl" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFontSize(option.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                fontSize === option.value
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tooltip: always mounted, shown/hidden imperatively — never via React
          state — so the browser selection is never disturbed by a re-render. */}
      <div
        ref={tooltipRef}
        className="absolute z-20 pointer-events-auto"
        style={{ display: "none", transform: "translate(-50%, -100%)" }}
      >
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={confirmHighlight}
          disabled={saving}
          className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg hover:bg-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? "Saving…" : "Highlight"}
        </button>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 mx-auto" />
      </div>

      <div
        ref={containerRef}
        className={`prose prose-gray max-w-none ${
          fontSize === "sm"
            ? "prose-sm"
            : fontSize === "base"
              ? "prose-base"
              : fontSize === "xl"
                ? "prose-xl"
                : "prose-lg"
        } ${isMobile && !highlightMode ? "select-none" : "select-text"}`}
        dangerouslySetInnerHTML={{ __html: baseHtml }}
      />

      {isMobile && showNoteSheet ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Add note</h3>
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                aria-label="Close note editor"
                className="rounded-full p-2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6 18 18" />
                </svg>
              </button>
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note"
              rows={5}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveNote}
                disabled={savingNote || !noteIsDirty}
                className="rounded-full border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNote ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMobile && showHighlightsSheet ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Highlights ({sortedHighlights.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowHighlightsSheet(false)}
                aria-label="Close highlights"
                className="rounded-full p-2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6 18 18" />
                </svg>
              </button>
            </div>
            {sortedHighlights.length === 0 ? (
              <div className="text-sm text-gray-500">—</div>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {sortedHighlights.map((highlight) => {
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
        </div>
      ) : null}
    </div>
  );
}

function isHtmlArticle(article: Article): boolean {
  return (
    (article.type === "bookmarklet" || article.type === "email") &&
    !!article.content_html
  );
}
