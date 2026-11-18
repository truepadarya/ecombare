# Case popups

Each plaque targets its own case: BrainRocket, Dashin Foundation, Playrix and
Grow Love (the Community plaque). All use the same renderer and Lumos shell,
with the clicked plaque restored as the opener on close.

`src/data/cases.ts` owns the typed case content and `casePopupByPlaque` mapping.
Each detail has a stable ID, accessible title, date, summary, cover, logo,
optional illustrated badge and its label, statistics, text or bullet-list sections and a
gallery with optional crop positions. Text is rendered through Astro's normal
escaping; the content model does not accept HTML strings.

The three additional cases follow Figma section 1489:751 (frames 1489:448,
1489:538 and 1489:663). Cover focal positions, logo widths and badge widths
are explicit artwork data, rather than case-specific layout classes. Source
images and complete illustrated badges are registered once through media:add.
The exact compact Dashin panel differs from the partner-marquee asset and is
registered separately. BrainRocket and Playrix reuse their existing white logos.

To assign distinct content, add a record to `caseDetails` and change the
corresponding entry in `casePopupByPlaque`. CaseBlobs checks plaque IDs against
the mapping. CasePopups renders each detail once using the same Modal shell;
the underlying Modal slot remains available for future layouts with different
content blocks. No popup copies are stored inside the buttons and no runtime
content injection or network fetch is required.

The renderer composes the existing full-screen Modal, Section, ContentWrapper,
Grid, Heading, Paragraph, RichText, Img, Overlay and Slider components. Modal's optional
`bodyClass` accepts utility classes; `padding-0` enables full-bleed sections.
The full-screen body uses a zero-minimum grid column so intrinsic image widths
cannot expand it when browser text is enlarged. Other Modal defaults remain.

Modal owns opening, closing, Escape, native modal focus handling, opener focus
restoration, scroll locking and transitions. Existing reduced-motion rules
apply. On reopening, Modal resets its vertical scroll, and CasePopups resets
its gallery. The gallery uses Slider's native swipe and keyboard navigation,
without extra controls. CaseGallery groups the case text and photos in one
stage. They move upward normally until the photo row fully enters from the
bottom; only then does the complete fragment pin. The text-to-photo gap stays
unchanged during horizontal travel. There is no full-height centering or second
top padding after the text. It maps vertical progress to horizontal movement until the last
photo. Native horizontal input and Slider keyboard commands synchronize the
vertical position. Short screens and reduced motion use a normal scrollable
row. Card widths are capped by the available height so wide screens retain
uncut images. Its images preserve the Figma crop and proportions.

Each photo opens a separate image variant of the shared Modal, matching the
reference's light overlay. Image dialogs are siblings of the case dialog,
avoiding nested click handlers and inherited full-screen styles. Closing the
image restores focus to its button while the case stays open at its current
scroll position. Modal handles Escape explicitly on the focused layer to avoid
native cancellation also dismissing an underlying dialog. Original descriptive
button labels are retained by Slider.

The cover, four photos and complete handwritten badge are local registered
assets imported through the media workflow. The original landscape cover is
used instead of the square plaque crop. Cover sizes account for portrait
viewports, avoiding a low-resolution source stretched across a tall scene.
The existing white Playrix logo is reused. The handwritten title is a graphic,
so the site still loads only Helvetica Neue. The partially off-canvas decorative
group above the cover in Figma is fully outside the clipped visible frame.

The cover uses Img's normal high quality instead of maximum quality. A browser
check measured a selected 828px version at 148,296 bytes versus 340,480 bytes
for the former maximum-quality output. This is a transfer-size comparison,
not a fixed load-time guarantee. As plaques approach within 900px of the
viewport, their cover starts loading with low priority. Hover or focus also
prepares it; opening raises priority. The same responsive image is reused,
without adding a duplicate preload download or eagerly loading the gallery.

Run `npm run test:case-popups` for all four triggers, single-dialog rendering,
11 viewport widths, asset loading, gallery traversal, large text, reduced
motion, reset, scroll lock and exact focus return. `test:case-blobs` covers
the original masked hover interaction; `test:interactions` and `test:nav`
verify the shared Modal consumers.
`test:case-content` verifies each additional case's date, statistics, bullet
list, images, photo layer, focus return, layouts at 375/768/1440/2500 and 200%
text. Popup scroll is reset after showModal, when the live scroll box exists,
preventing restored gallery offsets from replacing the cover on reopening.
`test:case-gallery` checks cover preparation/transfer size, vertical/horizontal
synchronization, all image layers, exact focus and position return, and
responsive lightbox bounds.

Below 1024px the gallery uses smaller native horizontal slides (1.45 visible on
phones, 1.9 on small tablets). Vertical modal scrolling never drives the row.
Desktop keeps the existing pinned gallery. Responsive sizes reflect displayed
widths for gallery photos, team posters, case plaques and decorative trees;
derived previews use high quality while preserving source originals.
