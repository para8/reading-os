"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShareReceiverClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Preparing share...");

  const payload = useMemo(() => {
    const url = searchParams.get("url") || "";
    const title = searchParams.get("title") || "";
    const text = searchParams.get("text") || "";
    return { url, title, text, key: `${url}|${title}|${text}` };
  }, [searchParams]);

  useEffect(() => {
    if (!payload.url && !payload.text) {
      setStatus("Nothing to save yet.");
      return;
    }

    const controller = new AbortController();

    const saveShare = async () => {
      setStatus("Saving to ReadingOS...");

      try {
        const response = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceUrl: payload.url || undefined,
            title: payload.title || undefined,
            text: payload.text || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setStatus("Unable to save this share.");
          return;
        }

        const data = (await response.json()) as { id?: string };
        if (data?.id) {
          router.replace(`/read/${data.id}`);
          return;
        }

        setStatus("Saved.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setStatus("Unable to save this share.");
        }
      }
    };

    void saveShare();

    return () => controller.abort();
  }, [payload.key, payload.text, payload.title, payload.url, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-gray-900">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Saving share...</h1>
        <p className="mt-4 text-base text-gray-600">{status}</p>
      </div>
    </div>
  );
}
