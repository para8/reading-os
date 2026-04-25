"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anonLoading, setAnonLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  async function handleAnonymousSignIn() {
    setAnonLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
      setAnonLoading(false);
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1
          className="text-2xl font-bold tracking-tight text-gray-900 mb-8"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          ReadingOS
        </h1>

        {sent ? (
          <p className="text-sm text-gray-500">
            Check your email for a sign-in link.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white text-sm rounded px-3 py-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>

            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnonymousSignIn}
              disabled={anonLoading}
              className="w-full border border-gray-200 text-gray-600 text-sm rounded px-3 py-2 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {anonLoading ? "Signing in…" : "Continue without account"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
