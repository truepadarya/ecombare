# Responsive sizing

## Foundation

- Minimum viewport: 360.
- Design viewport: 1440.
- Extra-wide viewport: 2500.
- Standard rem basis: 16; keep the browser root font setting.

The shared Lumos tokens live in src/styles/base.css.

## Shared primitives

Line heights: small 1.05, medium 1.2, large 1.3, huge 1.4.
Letter spacing: tight -0.04em, snug -0.01em, normal 0em, wide 0.02em.
Font family: Helvetica Neue. Available weights: regular 400, medium 500, bold 700.

Every text style references these shared primitives through var(). Values are
defined once in the primitive scales. Use the standard weight-* utilities for
explicit weight overrides. Do not create a second utility family or font alias.

## Heading size exception

Only H1-H5 use piecewise interpolation at 360, 992, 1440, 1920 and 2500.
H6 uses --text-main directly, as requested.

| Style | 360 | 992 | 1440 | 1920 | 2500 |
| ----- | --: | --: | ---: | ---: | ---: |
| H1    |  72 | 112 |  160 |  196 |  240 |
| H2    |  40 |  76 |  100 |  124 |  154 |
| H3    |  32 |  50 |   64 |   78 |   96 |
| H4    |  26 |  36 |   44 |   54 |   66 |
| H5    |  18 |  22 |   24 |   28 |   34 |

Each segment adds its clamped size increment. The four --fluid-* helpers are
shared only by the heading formulas. Growth is continuous, with exact values at
each anchor, and clamped outside 360–2500.

Reference technique: https://www.norq.kz/
Figma: https://www.figma.com/design/ofeZeqZ9BvoCmGhcd6F9T0/ECOmbare?node-id=1261-1211

## Paragraph sizes

Paragraphs use the ordinary Lumos clamp(min, fluid value, max), with the existing
360–1440 range. They have two configuration values per style, not five anchors:

| Style | Minimum at 360 | Maximum at 1440 |
| ----- | -------------: | --------------: |
| large |             18 |              24 |
| main  |             16 |              16 |
| small |             14 |              14 |

Values remain capped beyond the design viewport. Equal endpoints keep ordinary
and small text readable without an unnecessary responsive curve. H6 always
shares main's size.

All sizes above are pixels at the default 16px rem basis. Font size is
independent of pointer type and layout breakpoints.

## Verification

npm run test:responsive-typography verifies shared primitive references,
Figma metrics at 1440, exact heading anchors, ordinary paragraph interpolation,
continuity, clamping, local font loading, rem scaling, and propagation of edits
to the shared primitive scales.

npm run test:rich-text checks that plain HTML and RichText inherit this system.

## Wide-screen spacing

Existing spacing, section, container, navigation and control tokens preserve
360-1440 behavior and add independent clamped growth to 2500. No extra utility
family is needed. See [wide-screen spacing](wide-spacing-proposal.md) for endpoints.
