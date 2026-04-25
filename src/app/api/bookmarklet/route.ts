export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseHtml } from "@/lib/readability";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing token" },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  const { data: tokenRow } = await supabase
    .from("user_tokens")
    .select("user_id")
    .eq("bookmarklet_token", token)
    .single();

  if (!tokenRow) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  let body: {
    html?: string;
    title?: string;
    sourceUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const { html, title, sourceUrl } = body;

  if (!html) {
    return NextResponse.json(
      { error: "html is required" },
      { status: 400, headers: corsHeaders(origin) }
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

  const parsed = parseHtml(html, sourceUrl || "https://example.com");
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse article content" },
      { status: 422, headers: corsHeaders(origin) }
    );
  }

  const wordCount = (parsed.textContent || "").trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: title || parsed.title || "Untitled",
      source_url: sourceUrl || null,
      source_domain: sourceDomain,
      content_html: parsed.content,
      type: "bookmarklet",
      word_count: wordCount,
      user_id: tokenRow.user_id,
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  return NextResponse.json(data, { status: 200, headers: corsHeaders(origin) });
}
