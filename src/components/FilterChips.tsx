"use client";

import { useRouter } from "next/navigation";

interface FilterChipsProps {
  sourceTagCounts: Record<string, number>;
  themeTagCounts: Record<string, number>;
  activeSourceTag?: string;
  activeThemeTag?: string;
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
  sourceTagCounts,
  themeTagCounts,
  activeSourceTag,
  activeThemeTag,
}: FilterChipsProps) {
  const router = useRouter();

  const sourceTags = Object.entries(sourceTagCounts).sort((a, b) => b[1] - a[1]);
  const themeTags = Object.entries(themeTagCounts).sort((a, b) => b[1] - a[1]);

  if (sourceTags.length === 0 && themeTags.length === 0) return null;

  function navigate(param: "source_tag" | "theme_tag", value: string, isActive: boolean) {
    if (isActive) {
      router.push("/");
    } else {
      router.push(`/?${param}=${encodeURIComponent(value)}`);
    }
  }

  return (
    <div className="mb-8 space-y-2">
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
