import { NOINDEX_ROUTES, SITE_BASE } from "../consts.ts";

const normalize = (path: string) => `/${path.replace(/^\/+|\/+$/g, "")}`;

const excluded = new Set(NOINDEX_ROUTES.map(normalize));

/** Checks whether a route should be hidden from search. Used by BaseHead. */
export function isNoindexRoute(pathname: string): boolean {
  const path = pathname.startsWith(SITE_BASE)
    ? pathname.slice(SITE_BASE.length - 1)
    : pathname;
  return excluded.has(normalize(path));
}
