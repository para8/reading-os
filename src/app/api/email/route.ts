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
  // Remove the "---------- Forwarded message ---------\nFrom: ...\nDate: ..." block
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

  // Auto-resolve the single user's ID using the service role admin API
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError || !users.length) {
    return NextResponse.json(
      { error: "No authenticated users found — log in first" },
      { status: 500 }
    );
  }
  const systemUserId = users[0].id;

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

  const title = body.subject?.trim() || "Untitled Email";

  // Pipedream sends from as {value: [{address, name}], text, html}
  const senderEmail =
    body.from?.value?.[0]?.address ||
    body.from?.email ||
    null;

  let contentHtml = body.html || null;

  if (contentHtml) {
    contentHtml = stripGmailForwardHeader(contentHtml);
    if (body.attachments?.length) {
      contentHtml = replaceCidImages(contentHtml, body.attachments);
    }
  }

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
      user_id: systemUserId,
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
