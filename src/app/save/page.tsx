import Link from "next/link";
import PasteForm from "@/components/PasteForm";
import BookmarkletInstaller from "@/components/BookmarkletInstaller";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SavePage() {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("user_tokens")
    .select("bookmarklet_token")
    .eq("user_id", user.id)
    .single();

  let token = existing?.bookmarklet_token as string | undefined;

  if (!token) {
    token = crypto.randomUUID();
    await supabase.from("user_tokens").insert({ user_id: user.id, bookmarklet_token: token });
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </Link>
          <h1
            className="text-base font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Add article
          </h1>
          <div className="w-10" />
        </header>

        <div className="space-y-8">
          <BookmarkletInstaller appUrl={appUrl} token={token} />

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Paste text
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              For paywalled articles or newsletters — paste the text directly.
            </p>
            <PasteForm />
          </div>
        </div>
      </div>
    </main>
  );
}
