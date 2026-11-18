import type { APIRoute } from "astro";
import { SITE_IS_PUBLIC } from "@/consts";
import { sitePath } from "@/utils/site-path";

export const GET: APIRoute = ({ site }) => {
  const lines = ["User-agent: *", SITE_IS_PUBLIC ? "Allow: /" : "Disallow: /"];

  if (site && SITE_IS_PUBLIC) {
    lines.push(
      "",
      `Sitemap: ${new URL(sitePath("sitemap-index.xml"), site).href}`,
    );
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
