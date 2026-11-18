# Team scroll

`src/components/content/TeamSection.astro` owns the team sequence. It composes
the existing Section, ContentWrapper, Heading and Paragraph foundation. The
shared Slider and its arrow controls are no longer used for this section.

From 1024px, the stage stays at the top of the viewport while the document travels the
remaining horizontal width of the portrait row. The row's native `scrollLeft`
follows document progress directly. At the final portrait the sticky stage
releases, revealing the call to action and the following sections. Reverse
scrolling follows the same path. There are no wheel handlers, drag handlers,
timers, duplicate cards or additional scroll controllers. Phones and tablets use
the native horizontal row with smaller portraits, moved by swipe or keyboard;
vertical document scrolling never advances that row. The mobile CTA follows
the row closely and leaves the larger section gap after the button.

The complete heading and portrait group has more room above than below:
large section top padding and space-40 bottom padding (120px / 40px at 1440).
The subtitle-to-portrait gap uses space-40. Portrait width
is capped by available viewport height after the shared section spacing,
heading, gap and captions. If all six portraits fit, no extra scroll distance
is added. Short screens, enlarged text that leaves insufficient room for a
readable portrait, reduced motion and disabled JavaScript use a naturally
scrollable row instead of a pinned stage.

The row supports Left/Right, Home and End when focused. Tabbing to a portrait
also brings it into view and synchronizes document progress. Existing mask,
poster and video controls remain in TeamVideoCard; horizontal movement resets
videos to their posters. The call to action intentionally has no destination.

Run `npm run test:team` for responsive geometry, centering, full traversal,
release, reverse scrolling, wheel and keyboard interaction, accessible
fallbacks, precise mask hover and video playback checks. The placement before
this component is also checked by `npm run test:groasis`.
