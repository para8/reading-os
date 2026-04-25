"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

interface TooltipState {
  x: number;
  y: number;
  sel: Selection;
}

export default function ArticleContent({
  article,
  initialHighlights,
  focusHighlightId,
}: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalHtmlRef = useRef<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [saving, setSaving] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Store original innerHTML once on mount (for HTML articles)
  useEffect(() => {
    if (containerRef.current && isHtmlArticle(article)) {
      originalHtmlRef.current = containerRef.current.innerHTML;
    }
  }, [article]);

  // Re-apply marks whenever highlights change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    clearHighlightMarks(container);

    if (isHtmlArticle(article) && originalHtmlRef.current !== null) {
      container.innerHTML = originalHtmlRef.current;
    }

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
  }, [highlights, article, focusHighlightId]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setTooltip(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setTooltip(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 8,
      sel,
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setTooltip(null);
    },
    []
  );

  const handleHighlightClick = useCallback(
    async (e: React.MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(
        "button[data-delete-highlight-id]"
      ) as HTMLButtonElement | null;
      if (!btn) return;
      const id = btn.dataset.deleteHighlightId!;
      const res = await fetch(`/api/highlights/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHighlights((prev) => prev.filter((h) => h.id !== id));
      }
    },
    []
  );

  async function confirmHighlight() {
    if (!tooltip || !containerRef.current || saving) return;
    const offsets = getSelectionOffsets(containerRef.current, tooltip.sel);
    if (!offsets) return;

    setSaving(true);
    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: article.id,
        text: offsets.text,
        start_offset: offsets.start,
        end_offset: offsets.end,
      }),
    });

    if (res.ok) {
      const created: Highlight = await res.json();
      window.getSelection()?.removeAllRanges();
      setTooltip(null);
      setHighlights((prev) => [...prev, created]);
    }
    setSaving(false);
  }

  const isHtml = isHtmlArticle(article);

  return (
    <div
      className="relative"
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      onClick={handleHighlightClick}
    >
      {/* Floating tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-20 pointer-events-auto"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            onClick={confirmHighlight}
            disabled={saving}
            className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg hover:bg-gray-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? "Saving…" : "Highlight"}
          </button>
          {/* Caret */}
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 mx-auto" />
        </div>
      )}

      {/* Article content */}
      {isHtml ? (
        <div
          ref={containerRef}
          className="prose prose-lg prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content_html! }}
        />
      ) : (
        <div ref={containerRef} className="prose prose-lg prose-gray max-w-none">
          {(article.content_text || "")
            .split(/\n\n+/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>
      )}
    </div>
  );
}

function isHtmlArticle(article: Article): boolean {
  return (
    (article.type === "bookmarklet" || article.type === "email") &&
    !!article.content_html
  );
}
