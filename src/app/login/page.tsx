"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (!signInError) {
      window.location.href = "/";
      return;
    }

    // User doesn't exist yet — try creating an account
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      // User exists but password was wrong
      setError("Incorrect password. Try again.");
    } else {
      window.location.href = "/";
    }

    setLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          />
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white text-sm rounded px-3 py-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Continuing…" : "Continue"}
          </button>
        </form>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <p className="text-xs text-gray-400 mt-4 text-center">
          New to ReadingOS? Enter an email and password to create an account.
        </p>
      </div>
    </main>
  );
}
