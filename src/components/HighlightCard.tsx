import Link from "next/link";
import type { Highlight } from "@/lib/supabase";

interface HighlightCardProps {
  highlight: Pick<Highlight, "id" | "text" | "created_at">;
  articleId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HighlightCard({
  highlight,
  articleId,
}: HighlightCardProps) {
  return (
    <Link
      href={`/read/${articleId}?highlight=${highlight.id}`}
      className="block group"
    >
      <div className="border-l-2 border-yellow-300 pl-4 py-1 hover:border-yellow-500 transition-colors">
        <p
          className="text-gray-800 text-sm leading-relaxed"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {highlight.text}
        </p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(highlight.created_at)}</p>
      </div>
    </Link>
  );
}
