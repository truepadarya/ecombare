import { existsSync } from "node:fs";
import path from "node:path";

export function browserCandidates(
  platform = process.platform,
  env = process.env,
) {
  if (env.CHROME_PATH) return [env.CHROME_PATH];
  if (platform === "win32") {
    return [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA]
      .filter(Boolean)
      .flatMap((root) => [
        path.join(root, "Google/Chrome/Application/chrome.exe"),
        path.join(root, "Microsoft/Edge/Application/msedge.exe"),
      ]);
  }
  if (platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/opt/google/chrome/chrome",
  ];
}

export function findBrowser() {
  const candidates = browserCandidates();
  const browser = candidates.find((candidate) => existsSync(candidate));
  if (!browser) {
    throw new Error(
      "Chrome/Chromium not found. Install a browser or set CHROME_PATH to its executable path.",
    );
  }
  return browser;
}
