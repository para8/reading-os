export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Attachment = {
  contentId?: string;
  data?: string;
  contentType?: string;
};

function replaceCidImages(html: string, attachments: Attachment[]): string {
  return html.replace(/src="cid:([^"]+)"/gi, (_, cid) => {
    const match = attachments.find(
      (a) => a.contentId === cid || a.contentId === `<${cid}>`
    );
    if (!match?.data || !match?.contentType) return `src=""`;
    return `src="data:${match.contentType};base64,${match.data}"`;
  });
}

function stripGmailForwardHeader(html: string): string {
  return html.replace(
    /<div[^>]*class="[^"]*gmail_attr[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subject?: string;
    from?: {
      value?: Array<{ address?: string; name?: string }>;
      text?: string;
      email?: string;
    };
    html?: string;
    text?: string;
    attachments?: Attachment[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromAddress =
    body.from?.value?.[0]?.address ||
    body.from?.email ||
    null;

  if (!fromAddress) {
    return NextResponse.json({ error: "No sender address" }, { status: 400 });
  }

  const { data: tokenRow } = await supabase
    .from("user_tokens")
    .select("user_id")
    .eq("sender_email", fromAddress)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: "Unregistered sender" }, { status: 404 });
  }

  const title = body.subject?.trim() || "Untitled Email";

  let contentHtml = body.html || null;

  if (contentHtml) {
    contentHtml = stripGmailForwardHeader(contentHtml);
    if (body.attachments?.length) {
      contentHtml = replaceCidImages(contentHtml, body.attachments);
    }
  }

  const contentText = body.text || null;
  const wordCount = (contentText || "").trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title,
      source_url: `mailto:${fromAddress}`,
      source_domain: fromAddress,
      content_html: contentHtml,
      content_text: contentText,
      type: "email",
      word_count: wordCount || null,
      user_id: tokenRow.user_id,
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
