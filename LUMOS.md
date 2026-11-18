# Building with Lumos

## Page composition

Use Section, ContentWrapper, Grid, Heading, Paragraph and ButtonWrapper directly
in pages. Create a custom component only when it owns custom CSS or behavior.
Put custom selectors on native elements owned by that component, never on a
library component from outside. Call sites may pass utility classes.
Place component CSS in its own style is:global block under @layer components.
A page carries no custom CSS.

Use rem for lengths, ch for text widths and em for font-relative details.
Use Grid's existing breakpoints. Keep typography and spacing in the shared
tokens in src/styles/base.css; do not add parallel scales.

## Responsive foundation

The design reference is 1440px wide; the minimum target viewport is 360px.
The extra-wide sizing endpoint is 2500px. Keep --viewport-max: 1440 as the
Figma reference and --viewport-extra: 2500 as a separate wide-screen endpoint.
Use a standard 16px rem conversion and preserve the browser root font setting.

Only heading sizes use piecewise interpolation. Keep their exact 1440 Figma
values and continuous growth to 2500. Paragraphs use the ordinary Lumos min/max
clamp over 360–1440; H6 uses the main paragraph size directly. See
docs/responsive-sizing.md.

## Typography

Use one family, Helvetica Neue, with 400, 500 and 700 weights.
Use only h1, h2, h3, h4, h5, h6, large, main and small.
Heading tag controls semantics independently from its visual variant.
Paragraph uses large, main or small. Weight remains independent of the style.
All role-specific line-height, letter-spacing, family and weight tokens must
reference the shared primitive scales. Define each primitive value once. Use
weight-regular, weight-medium and weight-bold; do not add duplicate utilities.

Review the live scale at /typography-review.

RichText and the plain u-rich-text class share global formatting in patterns.css.
Native h1-h6 use the shared heading tokens; paragraphs and lists inherit the
parent text style, including large/main/small. H6 follows main for font size.
List markers, nesting, blockquotes and edge margin trimming work without
importing the RichText component. Review /example-components#rich-text and run
npm run test:rich-text after changes.

## Spacing and controls

Site margins use the existing --site-margin scale: 16px at 360 and 80px at
1440. Grid gutters use --site-gutter: 12px at 360 and 24px at 1440. Both
interpolate continuously, then grow independently to 120px / 32px at 2500.
The existing spacing scale, sections, navigation and controls also have approved
1440-2500 clamped growth. Values stay capped above 2500. Main content is capped
at 2260px and centered. See docs/wide-spacing-proposal.md for all endpoints.

Keep the existing fluid scale and semantic container/section spacing roles.
At 1440px, section small is 64px, medium (main) is 80px and large is 120px.
Small uses space-64 (40/64/96 at 360/1440/2500); medium uses space-80
(48/80/120). Large uses its existing independent clamp (88/120/240).
Use named sizes such as gap="24", marginTop="32", padding-24 and gap-16.
Below 48rem, sections map small to space-80 and medium to space-96; large has
a 100px minimum. Desktop section spacing remains unchanged. H1 starts at 72px
at 360 and retains the existing larger anchors.
Main content buttons fill their wrapper below 48rem and use the field minimum
height (56px at 360). Navigation opts out through mobileFullWidth=false;
desktop buttons retain a 48px minimum through 1440 and grow to 56px at
2500. Icon controls grow from 44px to 48px. Fields preserve a 56px minimum on
mobile and reach 64px at 1440 and 72px at 2500 through --field-min-height.
This shared field role is independent of section/spacing growth; do not size
control height through numeric spacing configuration endpoints. Field inline
padding grows from 16px to 24px to 32px. Interactions are retained.
Small radius is 8px; the main radius grows from 8px on mobile to 16px at 1440,
then stays capped. Fields use the main radius; buttons use the small radius.
Pill fields only change shape, not padding or height. Border width is 1px;
focus width and outer offset are 2px. Textareas derive height from line count
and shared padding, rather than copying the fixed 121px / 100px Figma boxes.
The 46px header buttons normalize to the shared 48px control height. Use the
existing padding-inline-24 utility for compact header insets.

Use :user-invalid after native validation, or aria-invalid with aria-describedby
for application errors. Invalid text fields reuse the normal focus outline
with --focus-color set to --error; do not add a second outline. Selected chips
retain their foreground color when invalid; use the error border and associated
message. Select placeholders use only --field-placeholder.
The shared --error role derives from purple-500; do not add
per-control error palettes. Form field gaps use space-16. Review /spacing-review
and /interaction-review; run test:interactions and test:starter for geometry,
keyboard, native validation, pointer states and long-label behavior.

## Colors

Keep concrete colors in the primitive swatches in base.css. Components consume
the existing semantic roles through var(); do not add per-component palettes.
Light is the default: white background, light-200 (#f5f5f5) secondary surface,
black text. Dark uses black with white text. Brand uses brand-500 (#ceff65)
with black text. Blue-500 (#5ac9fd) and purple-500 (#c96eff) are supporting
swatches, not extra themes. Local accent-blue/accent-purple contexts override
existing accent, heading and link roles; primary buttons retain the main brand.
Use theme-dark background-transparent over sufficiently dark media.
Secondary text uses the current text color at 70% opacity; placeholders use
the existing gray-600 swatch for readable contrast on field surfaces.
Primary buttons are lime with black text; brand sections use black with white
text. Hover colors derive from existing swatches.

Preserve the Lumos color-scheme / light-dark / scoped theme-invert mechanism.
Invert resolves against the nearest explicit theme: light to dark, dark to light,
brand to light. Button, field, tag, focus and selection roles stay centralized.
Use the darkened text-accent role for readable links on light surfaces; the raw
lime accent is for fills. Review /color-review and run test:colors after a build.

## Form delivery

Form requires an action for delivery. Missing configuration and HTTP/network
failures show the error message and retain entered data. Only an HTTP success
response shows success and resets fields. GET serializes values into the URL;
POST sends FormData. Native validation and submitter overrides are respected.
Pending requests lock associated submit buttons and prevent duplicate delivery;
button disabled states are restored afterward. Test with npm run test:form; its
requests are mocked and never deliver data to an external service.

Review pages use the existing Grid and Fieldset components. Control states are
compared by control type, with three columns on wider screens and a stacked
layout on phones. Reference spacing endpoints are available in native details.
These presentation changes must not modify runtime sizing tokens.

## Motion and interaction

Keep shared component transitions and behavior in menus, dropdowns, tabs,
accordions, modals, sliders, marquees and video controls. Preserve native
keyboard semantics, focus restoration, touch behavior and reduced motion.
Use native scrolling and keep component interactions in their Lumos owners.
Use the normal system cursor.

By explicit user request, every BaseLayout page uses Lenis 1.3.27 through
SmoothScroll.astro. Import the package's recommended CSS once there. Keep native
touch scrolling, automatic nested-scroll detection, anchor navigation and
reduced-motion support. The instance follows document overflow for modal locks
and is destroyed before an Astro page swap; do not add another scroll controller.

### Decorative underline

Use `Underline` from `src/components/typography/Underline.astro` around a phrase
inside Heading, Paragraph or RichText. Keep the slot to text and inline formatting
at the same font size; do not insert block elements. Native text wrapping is
preserved, including on narrow screens and with larger browser text.

The component measures rendered line fragments and repeats the original Figma
SVG stroke under each line. Color uses `--accent`; thickness and position follow
the inherited font size. It adds no global tokens or typography variants.
The source's 3.46-degree Figma rotation is retained inside the SVG asset.

The intact stroke reveals once when 80% of the phrase intersects the viewport
area above an 80px bottom inset. A 200ms pause precedes the 750ms drawing at constant
speed. Wrapped lines receive time in proportion to their widths. Text paints
above the stroke; normalized dash lengths are not used with non-scaling strokes.
Resizing or font changes
rebuild the lines without replaying completed motion. Use `animate={false}` for
a static stroke. Without JavaScript, with reduced motion, in forced colors or in
print, a native static underline remains. Decorative SVGs are hidden from assistive
technology; text, selection and inline link semantics remain native.

Review `/typography-review#underline`; run `npm run test:underline` after changes.

For an orchestrated sequence, pass `progress={0}` to `Underline` and update its
`data-progress` attribute from 0 to 1. This disables the automatic viewport
reveal; the component still owns stroke geometry and clipping. Leave `progress`
unset for the usual one-time viewport animation.

## Media workflow

1. Inspect the supplied visual and write an accurate English description.
2. Keep source originals outside src/assets, for example in .cache/media-sources.
3. Choose a descriptive lowercase kebab-case path in src/assets/graphics,
   icons or logo. Never upscale or distort the source. Preserve transparency.
4. For images and SVG, run:

```sh
npm run media:add -- --input SOURCE --output graphics/example.webp --id exampleImage --description "Describe what is actually visible." --max-size 1600
```

The command rotates, resizes without upscaling, optimizes to WebP, preserves
alpha and registers the file. SVG is preserved as SVG. Use --lossless for
screenshots and graphics, --decorative for purely decorative visuals.
It refuses overwrites; use --help for all options.

5. For video, prepare H.264 MP4 with yuv420p and faststart:

```sh
ffmpeg -i SOURCE -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart OUTPUT.mp4
ffmpeg -ss 0 -i OUTPUT.mp4 -frames:v 1 OUTPUT-poster.webp
ffmpeg -v error -i OUTPUT.mp4 -f null -
```

Preserve efficient existing streams with -c copy when appropriate. Match the
poster basename to the video. Register both with explicit imports and meaningful
descriptions. Preserve audio and proportions unless the design requires a change.

6. Use media.stableId.src through Img or Video. An explicit alt, including
alt="", overrides a shared image description. Video uses an accessible label,
not alt. Native media elements must use getMediaAlt/getMediaDescription.
On replacement, keep the stable ID and update its import and description.
7. Inspect /media-review, compression at full size, transparency, fine text and
the actual page at desktop/mobile widths. Keep originals available for comparison.
8. Run npm run check and npm run build. The registry is validated during every
build, even when Astro is invoked directly.

The validator checks registration, descriptions, stable IDs, file existence,
format, dimensions, filenames, size limits, MP4 faststart and matching posters.
Limits are 1.5 MiB per image, 100 KiB per SVG, 5 MiB per video and 4096 pixels per
raster dimension. Content media belongs in src/assets. Public is reserved for
browser/social files. Passing byte limits does not establish visual quality.
Run test:media-workflow and test:media-descriptions after changing this workflow.

## Partner logos

Use Logo from src/components/media/Logo.astro with a typed logo name, for example
<Logo logo="vizor" />. The 19 processed SVGs live in src/assets/logo; the catalog
is src/data/logos.ts. Descriptions come from the single media registry. Do not
create duplicate per-brand Astro wrappers or paste SVG markup into pages.

All logos are black with transparent negative space. Logo uses height:100%,
width:auto and max-width:none. Set a definite height on the owning component's native wrapper using
an existing spacing token. The review gallery uses space-48.

Detailed logos fill the parent height; broad wordmarks have centered optical
insets encoded in the SVG viewBox. Do not crop these insets or apply per-logo
CSS scaling. Width follows the intrinsic viewBox ratio. Use decorative when an
adjacent label or link already names the brand. No client JavaScript is needed.

The component scopes mask/clip IDs per render, including repeated instances.
Functional white inside a luminance mask is not visible white artwork. Keep it.
Review /media-review#partner-logos and run npm run test:logos after changes.
Source nodes and processing notes are in docs/partner-logos.md.

## Reference pages and checks

Keep /style-guide, /example-components, /typography-review, /color-review,
/spacing-review, /interaction-review, /motion-review and /media-review available.

Run npm run check and npm run build for every change. Use test:spacing for the
scale, test:typography for short-word handling, test:video and test:video-browser
for playback, and test:interactions for modals, sliders and fields.
Browser checks use installed Chrome/Chromium. Set CHECK_URL or CHROME_PATH when
needed. Never weaken validation to make a broken asset pass.

## Metadata

Set project identity in src/consts.ts. Set SITE_URL to the final HTTPS origin
before deployment. Review routes remain noindex. Indexing requires an explicit
SITE_INDEXABLE decision. No deployment destination is configured.
