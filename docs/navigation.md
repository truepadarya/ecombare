# Site navigation

The header uses the existing Nav, NavLink, Button, Img and full-screen Modal
components. It replaces the old isolated blend-mode wordmark. Logo artwork is
reused from the registered white ECOmbare symbol and wordmark; no duplicate
assets or icon library is added.

The desktop row has equal side columns around the link group, so the group is
centered relative to the page rather than the space between logo and actions.
Its gutters, site margins, maximum width, typography and button dimensions use
existing Lumos tokens and utilities. The navigation height now reserves the
standard button height plus the existing navigation padding.

On the homepage, the header switches from dark to light as the quote section
reaches its lower edge. Scrolling back into the hero restores dark mode. Both
the header and mobile menu use the shared theme classes; the existing white
logo is inverted within its native wrappers in light mode. Background, text
and logo use the shared 200ms hover timing, with global reduced-motion support.
The threshold follows the actual header height on resize and enlarged text.

Nav measures the natural link and action widths with ResizeObserver and after
fonts load. If the two equal side columns cannot fit, or the viewport is below
1024px, it switches to Menu before content overlaps. The initial compact markup
prevents an overflowing desktop flash. Enlarged browser text participates in
the same measurement.

The mobile panel uses the shared Modal's native dialog, close button,
open/close transitions, document scroll lock and opener focus restoration.
Escape closes it. Native modal behavior prevents background page interaction
while preserving access to browser chrome. Short panels scroll internally.
Reduced motion is handled by the existing global preference rule. There are
no staggered links, new motion libraries or per-link timers.

Selecting an anchor closes the dialog and lets native navigation / the shared
Lenis instance scroll to the section. Keyboard focus moves to that section.
Switching back to the desktop layout also closes the dialog and moves focus
to the visible home logo. Desktop links hidden by a resize move focus to Menu.
Without JavaScript a visible native navigation list remains available.

Links target About (#impact), What we do (#programs), Cases (#cases), Partners
(#partners), Technology (#technology), Team (#team) and Get in touch (#contact).
Review-page links return to the corresponding homepage sections. Donate uses
the user-approved email destination with the subject Supporting ECOmbare.

Run `npm run test:nav` for responsive geometry at 14 widths, enlarged text,
local logo loading, native dialog keyboard behavior, resize, anchors, short
screens, reduced motion and destinations. `test:interactions` covers shared
Modal behavior; `test:starter` checks the derived navigation height and routes.
