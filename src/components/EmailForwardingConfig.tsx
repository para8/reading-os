"use client";

import { useState } from "react";

const PIPEDREAM_EMAIL = "em6d48waedwfp8q@upload.pipedream.net";

export default function EmailForwardingConfig({
  defaultEmail,
}: {
  defaultEmail: string;
}) {
  const [senderEmail, setSenderEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    const res = await fetch("/api/user/sender-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_email: senderEmail }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Email &amp; newsletters
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Forward any email or newsletter to the address below — it will appear in
        your reading list.
      </p>

      <div className="flex items-center gap-2 mb-5">
        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 select-all truncate">
          {PIPEDREAM_EMAIL}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(PIPEDREAM_EMAIL)}
          className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shrink-0"
        >
          Copy
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        Only emails sent from this address will be accepted:
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </div>

      {status === "saved" && (
        <p className="mt-2 text-sm text-green-600">Saved</p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-500">Something went wrong — try again</p>
      )}
    </div>
  );
}
