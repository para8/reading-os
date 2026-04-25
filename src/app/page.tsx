import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ArticleCard from "@/components/ArticleCard";
import FilterChips from "@/components/FilterChips";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ source_tag?: string; theme_tag?: string }>;
}) {
  const { source_tag, theme_tag } = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Fetch all articles (tag columns only) to compute filter chip counts
  const { data: allForCounts } = await supabase
    .from("articles")
    .select("source_tags, theme_tags");

  const sourceTagCounts: Record<string, number> = {};
  const themeTagCounts: Record<string, number> = {};
  for (const row of allForCounts ?? []) {
    for (const t of row.source_tags ?? []) {
      sourceTagCounts[t] = (sourceTagCounts[t] ?? 0) + 1;
    }
    for (const t of row.theme_tags ?? []) {
      themeTagCounts[t] = (themeTagCounts[t] ?? 0) + 1;
    }
  }

  // Fetch articles with optional tag filter
  let query = supabase
    .from("articles")
    .select(
      "id, title, source_domain, created_at, word_count, type, source_tags, theme_tags"
    )
    .order("created_at", { ascending: false });

  if (source_tag) {
    query = query.contains("source_tags", [source_tag]);
  }
  if (theme_tag) {
    query = query.contains("theme_tags", [theme_tag]);
  }

  const { data: articles, error } = await query;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between mb-10">
          <h1
            className="text-2xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ReadingOS
          </h1>
          <nav className="flex items-center gap-5 text-sm">
            <span className="text-gray-900 font-medium">Library</span>
            <Link
              href="/highlights"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Highlights
            </Link>
            <Link
              href="/save"
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              + Add
            </Link>
          </nav>
        </header>

        <FilterChips
          sourceTagCounts={sourceTagCounts}
          themeTagCounts={themeTagCounts}
          activeSourceTag={source_tag}
          activeThemeTag={theme_tag}
        />

        {error && (
          <p className="text-red-500 text-sm">
            Failed to load articles. Check your Supabase configuration.
          </p>
        )}

        {!error && (!articles || articles.length === 0) && (
          <div className="text-center py-20 text-gray-400">
            {source_tag || theme_tag ? (
              <>
                <p className="text-lg mb-2">No articles match this filter.</p>
                <p className="text-sm">
                  <Link href="/" className="underline hover:text-gray-600">
                    Clear filter
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">No articles yet.</p>
                <p className="text-sm">
                  <Link href="/save" className="underline hover:text-gray-600">
                    Add your first article
                  </Link>{" "}
                  or install the bookmarklet.
                </p>
              </>
            )}
          </div>
        )}

        {articles && articles.length > 0 && (
          <div>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
