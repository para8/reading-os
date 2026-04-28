export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { parseHtml } from "@/lib/readability";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getSourceDomain(sourceUrl?: string) {
  if (!sourceUrl) return null;
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  let body: { sourceUrl?: string; title?: string; text?: string };

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { sourceUrl, title, text } = body;

  if (!sourceUrl && !text) {
    return jsonError("sourceUrl or text is required", 400);
  }

  const sourceDomain = getSourceDomain(sourceUrl);

  let html: string | null = null;

  if (sourceUrl) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "ReadingOS/1.0",
        },
      });
      if (response.ok) {
        html = await response.text();
      }
    } catch {
      html = null;
    }
  }

  if (html) {
    const parsed = parseHtml(html, sourceUrl || "https://example.com");
    if (!parsed) {
      return jsonError("Could not parse article content", 422);
    }

    const wordCount = (parsed.textContent || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: title || parsed.title || "Untitled",
        source_url: sourceUrl || null,
        source_domain: sourceDomain,
        content_html: parsed.content,
        type: "bookmarklet",
        word_count: wordCount,
        user_id: user.id,
      })
      .select("id, title")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return jsonError("Failed to save article", 500);
    }

    return NextResponse.json(data, { status: 200 });
  }

  if (text) {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: title?.trim() || "Untitled",
        source_url: sourceUrl || null,
        source_domain: sourceDomain,
        content_text: text,
        type: "paste",
        word_count: wordCount,
        user_id: user.id,
      })
      .select("id, title")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return jsonError("Failed to save article", 500);
    }

    return NextResponse.json(data, { status: 200 });
  }

  return jsonError("Unable to fetch content", 422);
}
