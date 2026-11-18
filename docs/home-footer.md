# Home footer

References: Figma `1444:6525` (1440px desktop) and `1446:6680` (375px phone),
file `ofeZeqZ9BvoCmGhcd6F9T0`. Both design screenshots and the phone motion
inventory were inspected. The supplied video already contains the animated
tree outlines, flowers, landscape and white transition; those layers are not
duplicated with additional images, SVG strokes or CSS animation.

HomeFooter composes the existing Section, Video, Img and Heading components
and shared layout/spacing/typography utilities. BaseLayout exposes a named
footer slot; the existing reference-page footer remains its default.

## Assets and playback

- Source original: `.cache/media-sources/landscape-drawing-original.mp4`.
- Registered video: `media.landscapeDrawingVideo`, H.264/yuv420p, 1954x1080,
  25fps, 4.8 seconds, 1,017,538 bytes. Remuxed with faststart; no resize or
  re-encoding. Compressed video packet SHA-256 matches the original:
  `e08138fcccd177efe7eb32b39d9043a43f926695f72513f5ac9ecd67955a9779`.
- Matching poster: original first frame, WebP quality 96, 1954px wide.
- White brand symbol and wordmark: exact Figma assets `77f84.svg` and
  `f8dd1.svg`, registered once; original SVG dimensions/viewBoxes preserved.
- Desktop displays the full landscape; phone crops from the left as in Figma.
- The latest user correction overrides the initial x2 request: normal speed,
  no loop, final frame held after ending, no replay when returning to the block.
- Shared Video viewport behavior starts at 25% visibility, pauses outside the
  viewport or when the tab is hidden, resumes unfinished playback and respects
  reduced motion. No extra playback controller is introduced.

## Links and intentional differences

Verified social destinations come from ECOmbare's own
[link directory](https://lnk.bio/ECOmbare):
[Instagram](https://www.instagram.com/ecombare/),
[Facebook](https://www.facebook.com/ecombare.cy),
[LinkedIn](https://www.linkedin.com/company/ecombare).
No tracking query parameters or social embeds are added.

Per user instruction, unconfirmed Telegram and Privacy/Terms/Cookies destinations
are omitted, including inactive placeholder links. No policy text is invented.
Technology is omitted until a corresponding destination exists. About points to
the impact/mission section; Cases to the case blobs section; Partners and Team to their sections.
Contacts use the two distinct desktop phone numbers, correcting the repeated
phone number in the mobile mockup. Email and telephone use native mailto/tel.
Removing unconfirmed legal links changes the space occupied by the bottom row.
The large brand artwork is static by explicit user request. Only the 69pixels
name in the credit links to https://69pixels.com/.

## Verification

`npm run test:home-footer` checks viewport start/pause, actual original speed,
loop disabled, final-frame hold and no replay, full-width layout at 360, 375, 768,
1024, 1440 and 2500, loaded/proportional SVGs, existing anchor targets, confirmed
social destinations, 200% text and reduced motion. Screenshots:
`.cache/footer-1440.png` and `.cache/footer-375.png`, visually compared with both
Figma references. Columns wrap when enlarged text needs more room.

`npm run test:video` checks the shared playback controller. Media validation and
full stream decoding pass; Astro check and production build are required.
