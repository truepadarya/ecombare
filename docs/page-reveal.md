# Page entrances

`PageReveal.astro` is an opt-in shared utility, included once in the home page's
head slot. Existing Lumos components forward the attributes onto their native
elements; no layout wrappers or animation dependencies are added.

- `data-reveal="0"` enables a scroll-controlled opacity and small upward entrance.
- `data-reveal-group` on an existing parent sequences its targets. Values `1`–`4`
  offset the scroll range by 10% of viewport height per step. Each target also
  waits for its own viewport entry. The reveal runs between 90% and 60% of
  viewport height; the end is capped by available page scroll for footer content.
- `data-reveal-effect="fade"` uses opacity only for masked artwork, scroll
  viewports and moving marquees. Their own transforms remain untouched.
- `data-reveal-pace="slow"` doubles the reveal scroll distance to 60% of viewport
  height. Both tree compositions use this slower variant.
- After hero, Web Animations are paused and their progress follows scroll position
  directly, with a gentle start and finish. Stopping the scroll freezes motion;
  reverse scrolling reverses it. Full visibility removes filled transforms.
- `data-reveal-timing` opts the hero into 700ms entrances with 120ms stagger.

The hero follows Eco, projects, description, CTA. Partners follow heading and
two rows. Technology follows partnership artwork, heading, paragraph and trees.
Team follows heading, subtitle and the complete card row. Programs, case
plaques, contact and footer use the same mechanism. Impact already owns its
scroll-driven sequence and is intentionally excluded. Navigation and popup
state transitions remain owned by their existing Lumos components.

The quote's underline follows the same scroll progress. Hero's underline retains
its timed drawing. Content is visible without JavaScript. An early inline script enables pending
styles only for normal-motion browsing; a 2.5-second watchdog fails open if the
controller does not initialize. Keyboard focus finishes any entrance containing
the target immediately. Reduced motion, forced colors, print and a restored
back/forward cache display all content. Hero does not replay on scroll return.
Listeners and animations are cleaned up before an Astro page swap.

Home order: hero, quote, programs, impact, cases, partners, technology, team,
contact, footer.

Run `npm run test:page-reveal` for scroll freeze/reversal, responsive visibility, order, hero replay, keyboard,
reduced-motion and no-JavaScript checks. Screenshots are saved in
`.cache/page-reveal`.

The native roots of pinned impact and team scenes isolate their stacking contexts
and clip paint to their own scroll ranges. Their sticky stages use the existing
opaque background utility, so adjacent content cannot bleed through. Run
`npm run test:scroll-scenes` for desktop pinning, stacking, clipping and release;
screenshots are saved in `.cache/scroll-scenes`.
