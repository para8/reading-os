"use client";

import { useRouter } from "next/navigation";

interface FilterChipsProps {
  totalArticles: number;
  completedCount: number;
  sourceTagCounts: Record<string, number>;
  themeTagCounts: Record<string, number>;
  activeSourceTag?: string;
  activeThemeTag?: string;
  activeStatus?: string;
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors ${
        active
          ? "bg-gray-800 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
      <span className={`text-[10px] ${active ? "text-gray-400" : "text-gray-400"}`}>
        {count}
      </span>
    </button>
  );
}

export default function FilterChips({
  totalArticles,
  completedCount,
  sourceTagCounts,
  themeTagCounts,
  activeSourceTag,
  activeThemeTag,
  activeStatus,
}: FilterChipsProps) {
  const router = useRouter();

  const sourceTags = Object.entries(sourceTagCounts).sort((a, b) => b[1] - a[1]);
  const themeTags = Object.entries(themeTagCounts).sort((a, b) => b[1] - a[1]);
  const showStatus = totalArticles > 0 || activeStatus === "completed";

  if (!showStatus && sourceTags.length === 0 && themeTags.length === 0) return null;

  function navigate(
    param: "source_tag" | "theme_tag" | "status",
    value: string,
    isActive: boolean
  ) {
    const params = new URLSearchParams();

    if (param !== "source_tag" && activeSourceTag) {
      params.set("source_tag", activeSourceTag);
    }
    if (param !== "theme_tag" && activeThemeTag) {
      params.set("theme_tag", activeThemeTag);
    }
    if (param !== "status" && activeStatus) {
      params.set("status", activeStatus);
    }

    if (!isActive) {
      params.set(param, value);
    }

    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div className="mb-8 space-y-2">
      {showStatus && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider select-none w-14 shrink-0">
            status
          </span>
          <Chip
            label="completed"
            count={completedCount}
            active={activeStatus === "completed"}
            onClick={() =>
              navigate("status", "completed", activeStatus === "completed")
            }
          />
        </div>
      )}
      {sourceTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider select-none w-14 shrink-0">
            source
          </span>
          {sourceTags.map(([tag, count]) => (
            <Chip
              key={tag}
              label={tag}
              count={count}
              active={activeSourceTag === tag}
              onClick={() => navigate("source_tag", tag, activeSourceTag === tag)}
            />
          ))}
        </div>
      )}
      {themeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider select-none w-14 shrink-0">
            theme
          </span>
          {themeTags.map(([tag, count]) => (
            <Chip
              key={tag}
              label={tag}
              count={count}
              active={activeThemeTag === tag}
              onClick={() => navigate("theme_tag", tag, activeThemeTag === tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
