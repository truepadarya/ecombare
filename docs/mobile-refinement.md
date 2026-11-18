# Mobile page refinement

The home page uses the existing Lumos foundation. The approved mobile changes are:

- H1 starts at 72px at 360px; larger anchors and desktop typography are retained.
- Main Button instances fill their ButtonWrapper below 48rem and use the existing
  field minimum height (56px at 360px). Nav opts out explicitly. Icon controls
  retain their dedicated geometry.
- Section small/medium map to space-80/space-96 below 48rem; large starts at 100px.
  Desktop roles remain unchanged. Spacing primitives remain the same.
- SignatureQuote removes desktop line breaks on phones and aligns naturally left.
  It now uses the existing H3 size on phones, with Section's mobilePaddingBottom
  set to small while keeping the large top and unchanged desktop spacing.
  Program summaries use H4 below 64rem, with full-width copy/media, more separation
  and no indented narrow column. Heading inherit now correctly inherits native
  semantic headings' font properties.
- Mobile program toggles update exclusive details and move the shared media in
  one synchronous layout. They preserve the clicked summary below navigation,
  using a correction handled by the existing Lenis owner (native fallback).
  Mobile FLIP offsets and internal scroll anchoring are disabled to avoid jumps
  when a tall previous item closes. Desktop interactions remain unchanged.
- The original case edge gradient is retained on phones.
- Impact retains its two-column mobile grid. When the numbers and mission fit the
  viewport, the same scroll controller pins the scene, reveals each number in
  order, dissolves the grid, types the mission and draws its underline. Short
  screens, large text, reduced motion and unsupported text highlights show the
  static readable layout. Desktop horizontal impact animation is retained.
- Team and popup galleries use native horizontal swipe below 64rem, never vertical
  scroll conversion. Team portraits and popup slides are smaller on phones.
  Desktop pinning remains intact. Keyboard and photo dialogs are retained.
- Team CTA is closer to its row, with the larger separation after the CTA.
- Team posters, trees, case plaques and gallery photos declare actual responsive
  sizes and use high-quality derivatives. Originals are preserved. Case covers
  start low-priority preparation 900px before entry.

Run `test:mobile-refinement`, `test:team`, `test:case-gallery`, `test:case-content`,
`test:responsive-typography`, `test:spacing`, `test:interactions` and `test:nav`.
`test:program-scroll` verifies every item, switching both directions, collapse,
stable click position and no delayed scroll jump. The mobile review screenshots
are in `.cache/mobile-refinement`.
