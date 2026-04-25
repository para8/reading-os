export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function normalizeTags(tags: unknown): string[] | null {
  if (!Array.isArray(tags)) return null;
  if (!tags.every((t) => typeof t === "string")) return null;
  return tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { source_tags?: unknown; theme_tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, string[]> = {};

  if ("source_tags" in body) {
    const tags = normalizeTags(body.source_tags);
    if (tags === null)
      return NextResponse.json(
        { error: "source_tags must be an array of strings" },
        { status: 400 }
      );
    update.source_tags = tags;
  }

  if ("theme_tags" in body) {
    const tags = normalizeTags(body.theme_tags);
    if (tags === null)
      return NextResponse.json(
        { error: "theme_tags must be an array of strings" },
        { status: 400 }
      );
    update.theme_tags = tags;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("articles")
    .update(update)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
