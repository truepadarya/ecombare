export const siteTextStyles = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "large",
  "main",
  "small",
] as const;
export type SiteTextStyle = (typeof siteTextStyles)[number];
export const textStyleNames: Record<SiteTextStyle, string> = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  large: "Paragraph large",
  main: "Paragraph main",
  small: "Paragraph small",
};
