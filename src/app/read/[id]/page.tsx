import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function readTime(wordCount: number | null) {
  if (!wordCount) return null;
  return `~${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <article className="mx-auto max-w-[680px]">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← All articles
          </Link>
        </div>

        <header className="mb-10">
          <h1
            className="text-3xl font-bold leading-tight text-gray-900 mb-4"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-400">
            {article.source_domain && article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 transition-colors"
              >
                {article.source_domain}
              </a>
            )}
            {article.source_domain && !article.source_url && (
              <span>{article.source_domain}</span>
            )}
            {article.source_domain && <span>·</span>}
            <span>{formatDate(article.created_at)}</span>
            {readTime(article.word_count) && (
              <>
                <span>·</span>
                <span>{readTime(article.word_count)}</span>
              </>
            )}
          </div>
        </header>

        {(article.type === "bookmarklet" || article.type === "email") && article.content_html ? (
          <div
            className="prose prose-lg prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />
        ) : (
          <div className="prose prose-lg prose-gray max-w-none">
            {(article.content_text || "")
              .split(/\n\n+/)
              .filter(Boolean)
              .map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        )}
      </article>
    </main>
  );
}
