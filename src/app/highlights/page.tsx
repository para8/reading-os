export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import HighlightCard from "@/components/HighlightCard";
import type { Highlight } from "@/lib/supabase";

type HighlightWithArticle = Highlight & {
  articles: {
    id: string;
    title: string;
    source_domain: string | null;
  } | null;
};

type ArticleGroup = {
  articleId: string;
  title: string;
  sourceDomain: string | null;
  count: number;
  mostRecent: string;
  highlights: Highlight[];
};

function groupByArticle(highlights: HighlightWithArticle[]): ArticleGroup[] {
  const map = new Map<string, ArticleGroup>();

  for (const h of highlights) {
    if (!h.articles) continue;
    const key = h.article_id;
    if (!map.has(key)) {
      map.set(key, {
        articleId: h.articles.id,
        title: h.articles.title,
        sourceDomain: h.articles.source_domain,
        count: 0,
        mostRecent: h.created_at,
        highlights: [],
      });
    }
    const group = map.get(key)!;
    group.count++;
    group.highlights.push(h);
    if (h.created_at > group.mostRecent) group.mostRecent = h.created_at;
  }

  return Array.from(map.values());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HighlightsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("highlights")
    .select(
      "id, text, start_offset, end_offset, created_at, article_id, user_id, articles(id, title, source_domain)"
    )
    .order("created_at", { ascending: false });

  const highlights = (data as HighlightWithArticle[] | null) ?? [];
  const groups = groupByArticle(highlights);

  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-[680px]">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            ReadingOS
          </h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Library
            </Link>
            <span className="text-gray-900 font-medium">Highlights</span>
          </nav>
        </header>

        {groups.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-sm">No highlights yet.</p>
            <p className="text-sm mt-1">
              Select text while reading to save your first highlight.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.articleId}>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <Link
                      href={`/read/${group.articleId}`}
                      className="text-base font-semibold text-gray-900 hover:text-gray-600 transition-colors"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {group.title}
                    </Link>
                    {group.sourceDomain && (
                      <span className="ml-2 text-xs text-gray-400">
                        {group.sourceDomain}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-4">
                    {group.count} {group.count === 1 ? "highlight" : "highlights"} · {formatDate(group.mostRecent)}
                  </span>
                </div>
                <div className="space-y-4">
                  {group.highlights.map((h) => (
                    <HighlightCard
                      key={h.id}
                      highlight={h}
                      articleId={group.articleId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
