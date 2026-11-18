/** Page metadata for `BaseHead` and layouts. */
export interface SeoProps {
  /** Page title. The site name is appended. */
  title?: string;
  /** Complete title, without appending the site name. */
  titleOverride?: string;
  /** Page and social description. Defaults to `SITE_DESCRIPTION`. */
  description?: string;
  /** Social image. Defaults to the registered neutral image placeholder. */
  image?: string;
  /** Accessible social image description. Defaults to its media description. */
  imageAlt?: string;
  /** Social image width in pixels. Inferred for registered images. */
  imageWidth?: number;
  /** Social image height in pixels. Inferred for registered images. */
  imageHeight?: number;
  /** Open Graph type. */
  type?: "website" | "article";
  /** Prevent indexing this page in addition to deployment and route rules. */
  noindex?: boolean;
}
