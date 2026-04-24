export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subject?: string;
    from?: { email?: string };
    html?: string;
    text?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.subject?.trim() || "Untitled Email";
  const senderEmail = body.from?.email || null;
  const contentHtml = body.html || null;
  const contentText = body.text || null;

  const textForCount = contentText || "";
  const wordCount = textForCount.trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title,
      source_url: senderEmail ? `mailto:${senderEmail}` : null,
      source_domain: senderEmail,
      content_html: contentHtml,
      content_text: contentText,
      type: "email",
      word_count: wordCount || null,
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
