"use client";

function buildBookmarkletHref(appUrl: string): string {
  const api = `${appUrl}/api/save`;
  // Minified bookmarklet — keep API URL as the only variable
  const code = `(function(){var A="${api}";var t=document.createElement("div");t.style.cssText="position:fixed;top:20px;right:20px;z-index:2147483647;padding:12px 20px;border-radius:8px;font:14px/1.4 -apple-system,sans-serif;background:#1a1a1a;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:opacity .3s";t.textContent="Saving\u2026";document.body.appendChild(t);function d(m,ok){t.textContent=m;t.style.background=ok?"#166534":"#991b1b";setTimeout(function(){t.style.opacity="0";setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},300)},2000)}fetch(A,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"bookmarklet",html:document.documentElement.outerHTML,sourceUrl:location.href,title:document.title})}).then(function(r){if(r.ok)d("Saved!",true);else d("Failed ("+r.status+")",false)}).catch(function(){d("Network error",false)})})();`;
  return `javascript:${encodeURIComponent(code)}`;
}

export default function BookmarkletInstaller({
  appUrl,
}: {
  appUrl: string;
}) {
  const href = buildBookmarkletHref(appUrl);

  return (
    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Bookmarklet
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Drag the button below to your Chrome bookmarks bar. Click it on any
        article page to save instantly.
      </p>

      <div className="flex items-center gap-3 mb-5">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href={href}
          onClick={(e) => e.preventDefault()}
          draggable
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg cursor-grab active:cursor-grabbing select-none"
        >
          Save to ReadingOS
        </a>
        <span className="text-sm text-gray-400">← drag this to your bookmarks bar</span>
      </div>

      <details className="text-sm">
        <summary className="text-gray-400 cursor-pointer hover:text-gray-600 select-none">
          Can&apos;t drag? Copy the code instead
        </summary>
        <div className="mt-3">
          <p className="text-gray-500 mb-2 text-xs">
            In Chrome, right-click the bookmarks bar → Add page → paste this as
            the URL:
          </p>
          <code className="block p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 break-all select-all">
            {href}
          </code>
        </div>
      </details>
    </div>
  );
}
