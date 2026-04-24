export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseHtml } from "@/lib/readability";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: {
    type?: string;
    html?: string;
    text?: string;
    title?: string;
    sourceUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { type, html, text, title, sourceUrl } = body;

  if (!type || (type !== "bookmarklet" && type !== "paste")) {
    return NextResponse.json(
      { error: "type must be 'bookmarklet' or 'paste'" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (type === "bookmarklet" && !html) {
    return NextResponse.json(
      { error: "html is required for bookmarklet type" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (type === "paste" && !text) {
    return NextResponse.json(
      { error: "text is required for paste type" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let sourceDomain: string | null = null;
  if (sourceUrl) {
    try {
      sourceDomain = new URL(sourceUrl).hostname;
    } catch {
      // ignore invalid URLs
    }
  }

  let insertData: Record<string, unknown>;

  if (type === "bookmarklet") {
    const parsed = parseHtml(html!, sourceUrl || "https://example.com");
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not parse article content" },
        { status: 422, headers: CORS_HEADERS }
      );
    }
    const wordCount = (parsed.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    insertData = {
      title: title || parsed.title || "Untitled",
      source_url: sourceUrl || null,
      source_domain: sourceDomain,
      content_html: parsed.content,
      type: "bookmarklet",
      word_count: wordCount,
    };
  } else {
    const wordCount = text!.trim().split(/\s+/).filter(Boolean).length;
    insertData = {
      title: title?.trim() || "Untitled",
      source_url: sourceUrl || null,
      source_domain: sourceDomain,
      content_text: text,
      type: "paste",
      word_count: wordCount,
    };
  }

  const { data, error } = await supabase
    .from("articles")
    .insert(insertData)
    .select("id, title")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
}
