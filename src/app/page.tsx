import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, source_domain, created_at, word_count, type")
    .order("created_at", { ascending: false });

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
          <Link
            href="/save"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            + Add
          </Link>
        </header>

        {error && (
          <p className="text-red-500 text-sm">
            Failed to load articles. Check your Supabase configuration.
          </p>
        )}

        {!error && (!articles || articles.length === 0) && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">No articles yet.</p>
            <p className="text-sm">
              <Link href="/save" className="underline hover:text-gray-600">
                Add your first article
              </Link>{" "}
              or install the bookmarklet.
            </p>
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
