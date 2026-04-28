import { Suspense } from "react";
import ShareReceiverClient from "./ShareReceiverClient";

function ShareReceiverFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-gray-900">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Saving share...</h1>
        <p className="mt-4 text-base text-gray-600">Preparing share...</p>
      </div>
    </div>
  );
}

export default function ShareReceiverPage() {
  return (
    <Suspense fallback={<ShareReceiverFallback />}>
      <ShareReceiverClient />
    </Suspense>
  );
}
