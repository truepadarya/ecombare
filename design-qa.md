# Hero visual QA

Source visual truth: user-provided hero attachment in the conversation (1440 ? 826 pixels).
Implementation screenshots: .cache/hero-1440.png, .cache/hero-375.png.
Viewport: 1440 ? 826 and 375 ? 826 CSS pixels, deviceScaleFactor 1. No density normalization required.
State: video playing at 0.5?, underline reveal completed, partner marquee playing without a toggle.

Full-view evidence: central two-line heading, body copy, primary button and full-width black partner strip follow the supplied composition. The video replaces the red placeholder as requested. Hero and strip together fill the viewport. Mobile content fits without horizontal overflow.
Focused comparison: inspected underline endpoints and weight, two-line desktop copy, button and white partner logos. Existing Helvetica Neue, h1/main typography, spacing tokens and standard button are retained. Standard button intrinsic width intentionally follows the user's requirement to reuse Lumos controls.
Colors/tokens: dark theme, white text, shared lime accent and button, even black overlay at 40%; no gradient overlay.
Image fidelity: supplied 1280 ? 720 video with matching first-frame poster; existing registered vector logos are inverted on their owned wrappers.
Copy: source wording retained, including Eco / projects and Plant with us.
Interactions checked in browser: video plays at 0.5?; no marquee pause button; no viewport overflow at desktop or mobile; completed underline has no clipping. Existing reduced-motion handling retained.

Comparison history: initial oversized underline stroke and clipped reveal bounds were corrected; .cache/hero-1440.png and .cache/hero-375.png show the corrected state. Initial centered stack was adjusted with the existing padding-top-64 class to match the reference's lower placement.
No actionable P0/P1/P2 findings remain. CTA destination remains unspecified and is intentionally not invented.

Implementation checklist: reuse Section, ContentWrapper, Heading, Paragraph, ButtonWrapper, Button, Video, Overlay, Underline, Marquee and Logo; run check/build and relevant playback/underline checks.

final result: passed


# Signature programs QA

Source: Figma ofeZeqZ9BvoCmGhcd6F9T0, node 1431:5750; first state 1431:5241, original 1440 x 810, reviewed from the Figma screenshot. All six states and their copy were inspected using design context.
Implementation screenshots: .cache/programs-1440.png and .cache/programs-360.png; CSS viewports 1440 x 900 and 360 x 900, density 1. Section top aligned for comparison; the taller desktop capture includes the standard section spacing.
State: Restore forest selected, supplied drawing video playing.
Full-view comparison: same numbered six-program list and right-hand portrait media composition. List inset uses space-64, Grid uses 7/5 spans across 12 columns, titles use existing h3 (64px at reference width), row gap space-16. Existing medium section padding and main radius intentionally follow the user's Lumos foundation requirement instead of introducing one-off 64px section padding or 24px radius.
Focused comparison: titles, description alignment, purple active selection and original portrait ratio checked. Source artwork is supplied dynamically through the six exact user-provided video clips, including baked drawing animation; no duplicate static overlays were added. Registered first-frame WebP posters preserve fallback quality.
Typography: shared Helvetica Neue bold h3 and medium main paragraphs, native wrapping and project short-word binding.
Colors: shared light theme, accent-purple selection, semantic color-text-2 paragraphs.
Image quality: original H264 streams remuxed without re-encoding, original 830 x 1080 ratio retained, no decoding errors.
Copy: source descriptions and order retained, punctuation corrected after terminal encoding replacement was detected.
Interaction checks: every program selected at 360/768/1024/1440/2500, one open item and matching panel, inactive videos paused, no overflow. Native Enter and Space work, selected item remains open, returning to a program starts viewport playback, reduced motion pauses playback. On mobile the shared video is placed under the selected description.
Iteration history: corrected punctuation encoding and replaced manual media pause calls with the existing viewport-restart controller; post-fix keyboard/replay/reduced-motion checks passed. Final screenshots re-captured and visually reviewed.
Validation: check, build, media description validation and browser checks passed. No actionable in-scope P0/P1/P2 findings remain.

final result: passed


# Programs mobile/tablet update

Source: Figma node 1433:5752, 375px mobile screenshot and full design context.
Implementation evidence: .cache/programs-adaptive-375.png, .cache/programs-adaptive-768.png, .cache/programs-adaptive-1440.png. Captured at native CSS width, deviceScaleFactor 1, height 1000; compare section content rather than extra viewport space.
The compact 210px-wide portrait video is aligned with the description. Numbered summaries use the existing h3 scale and standard Lumos arrow Icon, description/main typography, shared gap and radius tokens. Existing typography scaling intentionally stays centralized instead of adding a 30px mobile-only heading rule.
Phone and tablet below the existing 64rem large breakpoint use dropdowns; each can close, all titles retain full opacity, arrow indicates open/closed state. Desktop columns and distance fading remain.
All six program media remain the registered supplied clips with matching first-frame posters; no duplicate artwork or media introduced.
Checked widths: 360, 375, 768, 1023, 1024, 1440. No horizontal overflow; compact video width and text alignment verified; closing and changing programs verified. Returning from all-closed tablet state to desktop restores an active selection.
No actionable P0/P1/P2 findings remain.

final result: passed


# Impact and mission section QA

Source: Figma nodes 1434:5953 (desktop composition), 1434:5986 (all numbers), 1434:6030 (phone/tablet statistics). Source screenshots and design context reviewed. Desktop source is 1440 x 1203.
Implementation screenshots: .cache/impact-1440.png (1440 x 1203, deviceScaleFactor 1) and .cache/impact-375.png (375 x 1000, deviceScaleFactor 1). Mobile reference covers the numbers only; the implementation capture also shows the following mission.
Full-view comparison: six statistics in the supplied order, side-scrolling desktop rail, centered mission statement with purple here and lime underline, registered tree-ring/fingerprint background. Values use shared h2 and mission uses h3, paragraphs use main. Existing global font scale intentionally takes precedence over a new local 54px phone size. Shared section/gap/padding/radius tokens retained.
Focused comparison: all desktop amounts remain on one line, compact mobile values are 1,5k+ and 12k, labels and punctuation retained. Grid has two columns at phone/tablet sizes. The supplied registered illustration is used without recreation; its dimensions and decorative alt verified.
Scroll interaction: start/middle/end/reverse tested at 1024/1440/1920/2500. Translation matches vertical distance one to one and clamps at both ends. Last statistic is reachable. Browser scrolling remains native; no wheel interception, drag mechanism or autonomous motion. Below 64rem there is no pinning or extra scroll distance. Reduced motion disables the scroll linkage and provides an ordinary keyboard-scrollable desktop row.
Responsive checks: 360/375/768/1023 use compact grid; 1024/1440/1920/2500 use the linked rail. No page overflow.
Iteration history: corrected a literal Unicode escape, inherited Grid gap and nowrap amounts; final desktop screenshot re-captured and visually reviewed.
Validation: check/build passed; browser geometry, content, scroll mapping, direction reversal and reduced motion passed. No actionable in-scope P0/P1/P2 findings remain.

final result: passed


# Impact interaction revision

Supersedes the previous scroll-linked behavior by explicit user request. Removed the sticky wrappers, scroll mapping, transforms and artificial section height. The page now scrolls normally throughout.
Desktop numbers advance every 3500ms using native horizontal scrolling and scroll snapping. Mouse hover and keyboard focus pause the timer, mouse leave resumes, mouse drag/trackpad/touch swipe provide manual browsing. Offscreen/hidden-tab/reduced-motion states suppress autoplay. Phone and tablet retain the two-column static grid.
Browser verification: timed advance, hover pause/resume, mouse drag, Home/End keys, uninterrupted vertical page scrolling and tablet grid passed. Build/check passed.

final result: passed


# Numbers spacing and manual scrolling correction

Removed equal-width statistic boxes and their horizontal internal padding. Desktop items now size to their number/description content with the shared space-56 gap. Native mobile/tablet Grid remains two columns through a display-contents wrapper; the owned desktop row uses flex for variable widths.
Removed scroll snapping and release-to-nearest-card logic. Mouse drag follows the pointer directly, then decelerates with cancellable requestAnimationFrame momentum. Native touch/trackpad scrolling remains free. Autoplay still advances every 2000ms, pauses on hover and respects reduced motion.
Before: short-number gaps were about 192px versus 56px after 1,500+. After: measured number gaps 80/119/56/56/56px, reflecting description widths, with 56px between item boxes. Evidence: .cache/impact-spacing.png.
Browser checks passed: direct 160px drag, post-release smooth deceleration (160 to 181 to 237 to 245px), no snap, eventual stop, mobile/tablet grids without overflow, two-second autoplay, hover pause and reduced motion. Check/build passed.

final result: passed


# Restored original impact interaction

At the user's explicit request, restored the first scroll-linked desktop implementation: sticky section, one-to-one horizontal movement, original equal-width/padded statistics and gaps. Removed timer, pointer dragging, momentum and related handlers/styles. Phone/tablet two-column grid retained. Browser tests for start/middle/end/reverse and compact layouts passed. This supersedes the timer and free-drag revisions above.

final result: passed


# Impact storyboard sequence

Source: Figma node 1435:6304, six desktop states at 1440 x 878. Detailed screenshots reviewed for the middle numbers state (1435:6210) and full mission state (1435:6286). Figma motion inventory is empty; the storyboard and user clarification define the sequence. User specified that text begins only after all numbers have traversed and disappeared.
Implementation evidence: .cache/impact-motion-numbers.png, .cache/impact-motion-typing.png, .cache/impact-motion-mission.png, each 1440 x 878, density 1.
Sequence: scroll brings the numbers upward into the center, drives the complete horizontal traverse, then fades the numbers fully out. Only after opacity reaches zero, the mission types automatically with a caret; after the complete sentence the existing underline reveals. Final upward exit uses the native end of the sticky section. Scroll reversal before the text phase resets the typewriter.
Typography/layout/colors/assets: existing Lumos h2/main statistics, h3 mission, semantic purple context and shared lime underline; registered fingerprint/tree-ring image; project short-word binding retained, accounting for wrapping differences from Figma. No replacement assets, extra libraries or artificial duplicate frames.
Underline now supports an optional controlled progress prop/data-progress contract, while its default automatic viewport behavior is preserved and covered by test:underline.
Verification: numbers are fully invisible before the first text character; full text and underline finish; start/middle/fade/reverse states passed; scene fits ordinary desktop viewports including 1024 x 700 and 2500 x 1080. Phone/tablet retain the static grid and full mission. Reduced motion and screens too short for the complete text receive a static, naturally scrolling section. Tested 200% text in a fitting scene, 300% text fallback and 400px screen-height fallback.
Comparison: each phase screenshot visually reviewed against the corresponding storyboard. No actionable in-scope P0/P1/P2 findings remain. Check/build and original underline browser regressions passed.

final result: passed


# Scroll-driven reveal and global smooth scrolling

Supersedes automatic mission typing in the storyboard section above. Numbers now fade from zero opacity to full visibility at the center, traverse horizontally and disappear before the mission reveal starts. Mission letters and the existing underline follow scroll progress directly, including reversal. CSS Highlight ranges change paint without editing text nodes, so final line positions remain fixed throughout. A positioned caret follows the revealed character. Unsupported highlight browsers, reduced motion and short screens retain static readable content. Phone/tablet retain the two-column grid.

Installed the npm-verified latest Lenis 1.3.27 and initialized it once per BaseLayout document. Uses package CSS, auto RAF, anchors, automatic nested scrolling and overflow-driven modal locks; native touch and built-in live reduced-motion support are retained. Cleanup runs before Astro swaps.

Follow-up corrections: the background uses contain instead of cover and no vertical translation, preserving the complete outline at entry and exit. Controlled underlines at progress zero are entirely hidden to remove the leaked leading stroke. Captions are centered; desktop statistic widths follow number widths with a shared section-large gap (120px at 1440), replacing equal-width padded boxes that produced inconsistent visible gaps. Native grid-autofit supplies the compact two-column layout.

Browser evidence: .cache/impact-scroll-numbers.png, impact-scroll-quarter.png, impact-scroll-three-quarters.png and impact-scroll-full.png. Verified number opacity at start/middle/center, no text motion between quarter/three-quarter/full reveal, no advancement while scrolling is stopped, reverse reveal, no horizontal page overflow at 360/768/1024/1440/2500, reduced-motion fallback and wheel interpolation on a second page (early 198px, settled 598px for a 600px wheel input). Underline regression passed. Interaction regression initially had an intermittent forced-active CSS timing assertion; identical diagnostic and no-Lenis comparison runs subsequently passed both 375 and 1440, including sliders, dialogs, focus, native touch and fields. Astro check: 103 files, zero diagnostics; production build passed.
