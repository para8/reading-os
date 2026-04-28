export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sender_email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sender_email } = body;
  if (!sender_email) {
    return NextResponse.json({ error: "sender_email is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_tokens")
    .update({ sender_email })
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update sender_email:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
