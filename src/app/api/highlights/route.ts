import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    article_id?: string;
    text?: string;
    start_offset?: number;
    end_offset?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { article_id, text, start_offset, end_offset } = body;

  if (
    !article_id ||
    !text ||
    start_offset === undefined ||
    end_offset === undefined
  ) {
    return NextResponse.json(
      { error: "article_id, text, start_offset, end_offset are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("highlights")
    .insert({ article_id, user_id: user.id, text, start_offset, end_offset })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to save highlight" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
