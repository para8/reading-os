import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ArticleCard from "@/components/ArticleCard";
import FilterChips from "@/components/FilterChips";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    source_tag?: string;
    theme_tag?: string;
    status?: string;
  }>;
}) {
  const { source_tag, theme_tag, status } = await searchParams;
  const normalizedStatus = status === "completed" ? status : undefined;
  const supabase = await createSupabaseServerClient();

  // Fetch all articles (tag columns only) to compute filter chip counts
  const { data: allForCounts } = await supabase
    .from("articles")
    .select("source_tags, theme_tags, read_status");

  const totalArticles = allForCounts?.length ?? 0;
  const completedCount =
    allForCounts?.filter((row) => row.read_status === "completed").length ?? 0;
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
  if (normalizedStatus === "completed") {
    query = query.eq("read_status", "completed");
  }

  const { data: articles, error } = await query;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex flex-wrap items-center gap-4">
          <h1
            className="text-2xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ReadingOS
          </h1>
          <nav className="flex flex-1 items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-4 rounded-full border border-gray-200 bg-white p-1">
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                Library
              </span>
              <Link
                href="/highlights"
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Highlights
              </Link>
              <Link
                href="/insights"
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Insights
              </Link>
            </div>
            <Link
              href="/save"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 transition-colors"
            >
              + Add
            </Link>
          </nav>
        </header>

        <FilterChips
          totalArticles={totalArticles}
          completedCount={completedCount}
          sourceTagCounts={sourceTagCounts}
          themeTagCounts={themeTagCounts}
          activeSourceTag={source_tag}
          activeThemeTag={theme_tag}
          activeStatus={normalizedStatus}
        />

        {error && (
          <p className="text-red-500 text-sm">
            Failed to load articles. Check your Supabase configuration.
          </p>
        )}

        {!error && (!articles || articles.length === 0) && (
          <div className="text-center py-20 text-gray-400">
            {source_tag || theme_tag || normalizedStatus === "completed" ? (
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
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
