/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "ecombare";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION =
  "ecombare — built with the customized Lumos framework for Astro.";
/** Homepage title. */
export const SITE_TITLE = "ecombare";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. */
export { SITE_URL, SITE_BASE, SITE_IS_PUBLIC } from "../site.config.mjs";
/** BCP 47 locale tag used to format dates and numbers. */
export const SITE_LOCALE = "en-US";
/** Routes excluded from search and the sitemap. Surrounding slashes are ignored. */
export const NOINDEX_ROUTES: string[] = [
  "/404",
  "/example-components",
  "/media-review",
  "/typography-review",
  "/color-review",
  "/spacing-review",
  "/interaction-review",
  "/motion-review",
  "/style-guide",
];
