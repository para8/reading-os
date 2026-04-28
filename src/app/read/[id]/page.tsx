import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import TagEditor from "@/components/TagEditor";
import ArticleContent from "@/components/ArticleContent";
import ArticleDetailsSidebar from "@/components/ArticleDetailsSidebar";
import type { Highlight } from "@/lib/supabase";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { id } = await params;
  const { highlight: focusHighlightId } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const [{ data: article }, { data: highlights }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).single(),
    supabase
      .from("highlights")
      .select("*")
      .eq("article_id", id)
      .order("start_offset"),
  ]);

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
        <article className="min-w-0 flex-1">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← All articles
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <header className="mb-10">
              <h1
                className="mb-4 text-3xl font-bold leading-tight text-gray-900"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {article.title}
              </h1>
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Source & theme
                </div>
                <div className="space-y-2">
                  <TagEditor
                    articleId={article.id}
                    initialTags={article.source_tags ?? []}
                    label="source"
                  />
                  <TagEditor
                    articleId={article.id}
                    initialTags={article.theme_tags ?? []}
                    label="theme"
                  />
                </div>
              </div>
            </header>

            <ArticleContent
              article={article}
              initialHighlights={(highlights as Highlight[]) ?? []}
              focusHighlightId={focusHighlightId}
            />
          </div>
        </article>

        <ArticleDetailsSidebar
          article={article}
          highlights={(highlights as Highlight[]) ?? []}
        />
      </div>
    </main>
  );
}
