// Human-readable bookmarklet source. Minified version is generated in BookmarkletInstaller.tsx.
(function () {
  var API = "REPLACE_WITH_APP_URL/api/save";

  var toast = document.createElement("div");
  toast.style.cssText =
    "position:fixed;top:20px;right:20px;z-index:2147483647;padding:12px 20px;" +
    "border-radius:8px;font:14px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;" +
    "background:#1a1a1a;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);" +
    "transition:opacity 0.3s ease;";
  toast.textContent = "Saving\u2026";
  document.body.appendChild(toast);

  function dismiss(msg, ok) {
    toast.textContent = msg;
    toast.style.background = ok ? "#166534" : "#991b1b";
    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2000);
  }

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "bookmarklet",
      html: document.documentElement.outerHTML,
      sourceUrl: location.href,
      title: document.title,
    }),
  })
    .then(function (r) {
      if (r.ok) {
        dismiss("Saved!", true);
      } else {
        dismiss("Failed (" + r.status + ")", false);
      }
    })
    .catch(function () {
      dismiss("Network error", false);
    });
})();
