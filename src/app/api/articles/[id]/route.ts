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

  let body: {
    source_tags?: unknown;
    theme_tags?: unknown;
    read_status?: unknown;
    read_at?: unknown;
    note?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, string[] | string | null> = {};

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

  if ("read_status" in body) {
    if (body.read_status !== "in_progress" && body.read_status !== "completed") {
      return NextResponse.json(
        { error: "read_status must be in_progress or completed" },
        { status: 400 }
      );
    }
    update.read_status = body.read_status;

    if (body.read_status === "completed") {
      if ("read_at" in body && body.read_at !== null && typeof body.read_at !== "string") {
        return NextResponse.json(
          { error: "read_at must be a timestamp string or null" },
          { status: 400 }
        );
      }
      update.read_at =
        typeof body.read_at === "string" ? body.read_at : new Date().toISOString();
    } else {
      update.read_at = null;
    }
  } else if ("read_at" in body) {
    if (body.read_at !== null && typeof body.read_at !== "string") {
      return NextResponse.json(
        { error: "read_at must be a timestamp string or null" },
        { status: 400 }
      );
    }
    update.read_at = body.read_at;
  }

  if ("note" in body) {
    if (body.note !== null && typeof body.note !== "string") {
      return NextResponse.json(
        { error: "note must be a string or null" },
        { status: 400 }
      );
    }
    update.note = body.note;
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
