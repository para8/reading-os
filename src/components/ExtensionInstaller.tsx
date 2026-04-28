type ExtensionInstallerProps = {
  appUrl: string;
  token: string;
};

export default function ExtensionInstaller({
  appUrl,
  token,
}: ExtensionInstallerProps) {
  return (
    <section className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Chrome extension
        </h2>
        <p className="text-sm text-gray-500">
          Load the extension from the repo and set the App URL + token.
        </p>
      </div>

      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
        <li>Open chrome://extensions and enable Developer mode.</li>
        <li>Click Load unpacked → select the chrome-extension folder.</li>
        <li>Open the extension options and paste the values below.</li>
        <li>Click the extension icon on any page to save it.</li>
      </ol>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">App URL</p>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            readOnly
            value={appUrl}
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Token</p>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            readOnly
            value={token}
          />
        </div>
      </div>
    </section>
  );
}
