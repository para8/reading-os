import { NextRequest, NextResponse } from "next/server";

function appendParam(target: URL, key: string, value: string | null) {
  if (!value) return;
  target.searchParams.set(key, value);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const url = formData.get("url");
  const title = formData.get("title");
  const text = formData.get("text");

  const redirectUrl = new URL("/share-receiver", request.url);

  appendParam(redirectUrl, "url", typeof url === "string" ? url : null);
  appendParam(redirectUrl, "title", typeof title === "string" ? title : null);
  appendParam(redirectUrl, "text", typeof text === "string" ? text : null);

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
