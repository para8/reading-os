import Link from "next/link";
import { Article } from "@/lib/supabase";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readTime(wordCount: number | null) {
  if (!wordCount) return null;
  return `~${Math.max(1, Math.ceil(wordCount / 200))} min`;
}

export default function ArticleCard({
  article,
}: {
  article: Pick<
    Article,
    "id" | "title" | "source_domain" | "created_at" | "word_count" | "type"
  >;
}) {
  return (
    <article className="py-5 border-b border-gray-100 last:border-0">
      <Link href={`/read/${article.id}`} className="group block">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-1.5">
          {article.title}
        </h2>
        <div className="flex items-center gap-2.5 text-sm text-gray-400">
          {article.source_domain && (
            <span className="text-gray-500">{article.source_domain}</span>
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
      </Link>
    </article>
  );
}
