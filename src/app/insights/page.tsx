import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import InsightsClient from "@/components/InsightsClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("read_at, word_count, theme_tags")
    .eq("read_status", "completed")
    .not("read_at", "is", null)
    .order("read_at", { ascending: true });

  const completedArticles = (articles ?? []).filter(
    (article) => article.read_at
  ) as {
    read_at: string;
    word_count: number | null;
    theme_tags: string[] | null;
  }[];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            ReadingOS
          </h1>
          <nav className="flex flex-1 items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-4 rounded-full border border-gray-200 bg-white p-1">
              <Link
                href="/"
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Library
              </Link>
              <Link
                href="/highlights"
                className="rounded-full px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Highlights
              </Link>
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                Insights
              </span>
            </div>
          </nav>
        </header>

        {error ? (
          <p className="text-sm text-red-500">
            Failed to load insights. Check your Supabase configuration.
          </p>
        ) : (
          <InsightsClient articles={completedArticles} />
        )}
      </div>
    </main>
  );
}
