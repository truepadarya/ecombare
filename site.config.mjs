import { loadEnv } from "vite";
import { isIP } from "node:net";

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";
const env = loadEnv(mode, process.cwd(), "SITE_");
const configured = (
  process.env.SITE_URL ??
  env.SITE_URL ??
  ""
).trim();
const url = new URL(configured || "http://localhost:4321");

if (
  !["http:", "https:"].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash
) {
  throw new Error(
    "SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.",
  );
}

export const SITE_URL = url.origin;
const configuredBase = (process.env.SITE_BASE ?? env.SITE_BASE ?? "/").trim();
if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(configuredBase)) {
  throw new Error("SITE_BASE must be a root-relative directory path.");
}
export const SITE_BASE = configuredBase.replace(/\/+$/, "") + "/";
export const SITE_IS_PUBLIC =
  mode === "production" &&
  Boolean(configured) &&
  url.protocol === "https:" &&
  !isIP(url.hostname.replace(/^\[|\]$/g, "")) &&
  !/(^localhost$|\.localhost$|\.local$|\.test$)/i.test(url.hostname) &&
  (process.env.SITE_INDEXABLE ?? env.SITE_INDEXABLE) !== "false";
