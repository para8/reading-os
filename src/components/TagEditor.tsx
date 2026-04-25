"use client";

import { useTransition, useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";

interface TagEditorProps {
  articleId: string;
  initialTags: string[];
  label: "source" | "theme";
  onTagsChange?: (tags: string[]) => void;
}

async function saveTags(
  articleId: string,
  field: "source_tags" | "theme_tags",
  tags: string[]
) {
  await fetch(`/api/articles/${articleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: tags }),
  });
}

export default function TagEditor({
  articleId,
  initialTags,
  label,
  onTagsChange,
}: TagEditorProps) {
  const [tags, setTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const field = label === "source" ? "source_tags" : "theme_tags";
  const filterParam = label === "source" ? "source_tag" : "theme_tag";

  function commitInput() {
    const val = inputValue.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      const next = [...tags, val];
      setTags(next);
      onTagsChange?.(next);
      startTransition(() => {
        saveTags(articleId, field, next);
      });
    }
    setInputValue("");
    setIsAdding(false);
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    onTagsChange?.(next);
    startTransition(() => {
      saveTags(articleId, field, next);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInput();
    } else if (e.key === "Escape") {
      setInputValue("");
      setIsAdding(false);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handleContainerClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      className="flex items-center gap-2 min-h-[28px]"
      onClick={handleContainerClick}
    >
      {/* Label */}
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider select-none w-14 shrink-0">
        {label}
      </span>

      {/* Tags + input row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-2 py-1 group transition-colors"
          >
            <Link
              href={`/?${filterParam}=${encodeURIComponent(tag)}`}
              className="hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {tag}
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        {isAdding ? (
          <input
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitInput}
            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-gray-500 bg-white text-gray-800 placeholder-gray-400 w-28"
            placeholder="type & press Enter"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="text-xs text-gray-400 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 rounded px-2 py-1 transition-colors leading-none"
            aria-label={`Add ${label} tag`}
          >
            + add
          </button>
        )}
      </div>
    </div>
  );
}
