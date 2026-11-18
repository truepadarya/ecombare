import { media, type MediaEntry } from "@/data/media";

const normalize = (url: string) =>
  url.split(/[?#]/)[0].replace(/^\/@fs\/.*(?=\/src\/assets\/)/, "");

const byUrl = new Map<string, MediaEntry & { id: string }>(
  Object.entries(media).map(([id, entry]) => [
    normalize(typeof entry.src === "string" ? entry.src : entry.src.src),
    { ...entry, id },
  ]),
);

/** Finds shared descriptions for imported media and local asset URLs. */
export function getMediaDescription(
  source?: ImageMetadata | string,
): (MediaEntry & { id: string }) | undefined {
  const url = typeof source === "string" ? source : source?.src;
  if (!url) return undefined;
  return byUrl.get(normalize(url));
}

/** Uses explicit alt text first, including an empty string for decorative images. */
export function getMediaAlt(
  source?: ImageMetadata | string,
  alt?: string,
): string {
  if (alt !== undefined) return alt;
  const metadata = getMediaDescription(source);
  return metadata && !metadata.decorative ? metadata.description : "";
}
