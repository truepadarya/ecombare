/** Resolves an internal path or homepage anchor under the deployment base. */
export function sitePath(path = ""): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}
