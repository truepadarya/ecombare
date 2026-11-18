# Groasis partnership section

Figma source: file `ofeZeqZ9BvoCmGhcd6F9T0`, selection `1469:853`.
The sparse selection was resolved into the full desktop `1277:13428` and phone
`1277:11492` designs, including screenshots and original asset URLs.

`GroasisSection.astro` is immediately before Team in `index.astro`. It composes
Section, ContentWrapper, Heading, Paragraph and Img. Typography follows the
existing h3/main styles and section spacing follows the shared medium role.
The 32px mobile h3 scale is retained rather than introducing the mockup's
separate 30px size; narrow screens may wrap the second sentence naturally.
The phone's status bar and navigation are frame context, not part of this block.

The two partnership stickers are decorative artwork, not inactive buttons.
Existing ECOmbare symbol/wordmark assets are reused with black rendering. The
original Groasis wordmark and purple heart are local registered assets. Sticker
shapes use shared brand/blue accent roles and original rotations/proportions.

`GroasisTrees.astro` owns two arrangements of the six original transparent
rasters: evergreen, small deciduous tree, broad-canopy tree, round low tree,
flowers and grass. Each source is registered once. Original Figma layer geometry
and crop windows are retained; root SVG dimensions and alpha are preserved.
No source is enlarged during processing. Original files remain under
`.cache/media-sources/groasis`.

Desktop trees frame the text. Below the standard 64rem breakpoint, one combined
tree composition follows the text in document flow, and the right composition
is hidden. The existing screen-height role is locally disabled on phones so
short content does not force a full empty screen. Large text and short screens
can increase section height naturally. No animation or client JavaScript is added.

The previously absent footer Technology item now targets `#technology`.

Verification: `npm run test:groasis` covers placement, accessible labels, loaded
artwork at 360/375/768/1024/1440/1920/2500, tree arrangement, no horizontal overflow,
200% text, short screens and the footer anchor. Screenshots at
`.cache/groasis-1440.png`, `.cache/groasis-1024.png` and `.cache/groasis-375.png`
were visually reviewed against the desktop and phone references. Media checks,
Astro check and production build passed.
