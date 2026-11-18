// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE_URL, SITE_BASE, SITE_IS_PUBLIC } from "./site.config.mjs";
import { isNoindexRoute } from "./src/utils/seo.ts";
import { validateMedia } from "./scripts/lib/media-validation.mjs";

export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  integrations: [
    {
      name: "isolated-vite-cache",
      hooks: {
        "astro:config:setup": ({ command, updateConfig }) => {
          updateConfig({ vite: { cacheDir: `.astro/vite-${command}` } });
        },
      },
    },
    {
      name: "media-validation",
      hooks: {
        "astro:build:start": async () => {
          await validateMedia();
        },
      },
    },
    ...(SITE_IS_PUBLIC
      ? [
          sitemap({
            filter: (page) => !isNoindexRoute(new URL(page).pathname),
          }),
        ]
      : []),
  ],
  fonts: [
    {
      name: "Helvetica Neue",
      cssVariable: "--font-helvetica-neue",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/helvetica-neue-regular.woff2"],
          },
          {
            weight: 500,
            style: "normal",
            src: ["./src/assets/fonts/helvetica-neue-medium.woff2"],
          },
          {
            weight: 700,
            style: "normal",
            src: ["./src/assets/fonts/helvetica-neue-bold.woff2"],
          },
        ],
      },
    },
  ],
  vite: {
    build: { cssTarget: "safari15.4" },
    server: { watch: { ignored: ["**/.cache/**"] } },
  },
});
