import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Article {
  id: string;
  title: string;
  source_url: string | null;
  source_domain: string | null;
  content_html: string | null;
  content_text: string | null;
  type: "bookmarklet" | "paste";
  word_count: number | null;
  created_at: string;
}
