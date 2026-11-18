# Case blobs

Design references: Figma desktop `1447:6929`, original shapes `1447:7026`
(children 7022-7025), phone `1277:12587`; file `ofeZeqZ9BvoCmGhcd6F9T0`.
Implemented in `CaseBlobs.astro`, after Team and before Contact. Footer Cases
navigation now targets this section. Distinct popup content and mappings are
documented in case-popups.md.

## Foundation and assets

The scene uses Section, Img, the existing Dashin Foundation Logo and shared
width, positioning, pointer and theme classes. Custom component rules own the
irregular composition, gradients, clipping, rotations and interactive transforms.
Section itself has no additional spacing: the art's gradient dividers define
the transitions. Phone preserves the source's white upper spacer and bottom
gradient; desktop uses gradients at both edges.

The four supplied archive photographs are the source of truth on both viewport
layouts. The older phone reference contains different photos for three projects;
those were not substituted for the newly supplied archive. Originals are kept in
`.cache/media-sources/case-blobs`. Registered photos are 1316px WebP at quality 94,
447/423/637/802 KiB, preserving proportions and without upscaling.

The four individual Figma SVG shapes are registered unchanged under
`graphics/case-masks`. Their original artwork defines SVG clip paths, normalized
only through a clipPath transform. Photos and pointer hit areas therefore share
the exact silhouette; transparent rectangular corners do not trigger hover.
Dashin and community rotations match their design transforms. The Community
source had a 42px transparent strip along its left edge. It is cropped from the
replacement image while preserving the stable media ID, so no straight gap can
appear inside the mask. The obsolete processed asset is removed; the original
archive image remains in the source cache.

The black Dashin Foundation logo on a white semantic-theme surface reuses the
existing library. BrainRocket and Playrix use the original white Figma variants:
the partner-marquee variants contain optical insets unsuitable for this artwork
slot. Original root dimensions/viewBoxes remain intact; no per-brand CSS scaling
or library edits were introduced. The fourth emblem uses the supplied Figma
image as a white mark, hidden on phones as shown in the reference.

## Interaction

Pointer hover grows the selected blob to 1.08 and moves nearby blobs away using
elliptical-distance weighting. Only transforms animate; section and document
geometry do not change. Transitions use 420ms cubic-bezier(0.22,1,0.36,1), with
no bounce or ambient motion. Repeated pointer transitions retarget immediately
from the current visual state; geometry always derives from resting offsets,
preventing accumulated drift. Resize recalculates those offsets.

Keyboard focus provides the same emphasis immediately. Its rectangular outline
is replaced with a subtle shadow around the painted mask; forced colors retains
a system outline. Coarse pointers do not acquire sticky hover. Reduced motion removes
scaling and displacement entirely. Listeners and ResizeObserver are disposed
before Astro swaps. Native type=button controls have descriptive labels and
stable data-case IDs. Accessible titles and dialog destinations come from the
single typed case-content registry.

## Verification

`npm run test:case-blobs` checks silhouette hit testing, animated rather than
instant pointer growth, neighbor displacement, interrupted transitions, exact
reset, no page shifts, keyboard focus, reduced motion, loaded artwork, no
horizontal overflow at 360/375/768/1024/1440/2500 and 200% text. Desktop and phone
screenshots: `.cache/case-blobs-1440.png`, `.cache/case-blobs-375.png`.

The same check verifies the user's concurrent page corrections: native root
scrollbar, non-clickable footer logo, 69pixels credit link, and the four requested
quote lines on desktop. On narrower screens the explicit lines wrap naturally
as needed. Root scrollbar styling was removed; Lenis smooth scrolling remains.
