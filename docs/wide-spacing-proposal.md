# Wide-screen spacing

Status: approved and implemented in src/styles/base.css.

All dimensions below are pixels at the default 16px rem basis. The existing
360–1440 interpolation and exact 1440 values are preserved. The second segment
interpolates independently from 1440 to 2500, then stays capped. The 1920 column
is calculated from that segment and is not an additional breakpoint.

## Shared spacing scale

| Token | 1440 | 1920 | 2500 |
| --- | ---: | ---: | ---: |
| space-4 | 4 | 4 | 4 |
| space-8 | 8 | 8.91 | 10 |
| space-12 | 12 | 13.81 | 16 |
| space-16 | 16 | 17.81 | 20 |
| space-20 | 20 | 21.81 | 24 |
| space-24 | 24 | 27.62 | 32 |
| space-28 | 28 | 31.62 | 36 |
| space-32 | 32 | 37.43 | 44 |
| space-36 | 36 | 41.43 | 48 |
| space-40 | 40 | 47.25 | 56 |
| space-44 | 44 | 53.06 | 64 |
| space-48 | 48 | 58.87 | 72 |
| space-52 | 52 | 62.87 | 76 |
| space-56 | 56 | 66.87 | 80 |
| space-64 | 64 | 78.49 | 96 |
| space-68 | 68 | 84.3 | 104 |
| space-72 | 72 | 90.11 | 112 |
| space-80 | 80 | 98.11 | 120 |
| space-88 | 88 | 109.74 | 136 |
| space-96 | 96 | 117.74 | 144 |
| space-112 | 112 | 137.36 | 168 |
| space-124 | 124 | 151.17 | 184 |

Tiny intervals grow slowly; the 4px step stays fixed. Larger steps gain more
space, matching the larger heading scale. Values remain ordered throughout
the interval because both endpoint sequences are ordered.

## Existing semantic roles

| Existing role | 1440 | 1920 | 2500 |
| --- | ---: | ---: | ---: |
| site-margin | 80 | 98.11 | 120 |
| site-gutter | 24 | 27.62 | 32 |
| section-space-small | 64 | 78.49 | 96 |
| section-space-medium | 80 | 98.11 | 120 |
| section-space-large | 120 | 174.34 | 240 |
| section-space-nav-overlap | 224 | 267.47 | 320 |
| control-min-height | 48 | 51.62 | 56 |
| field-min-height | 64 | 67.62 | 72 |
| control-icon-size | 44 | 45.81 | 48 |
| control-pad-block | 12 | 13.81 | 16 |
| button-pad-inline | 32 | 35.62 | 40 |
| field-pad-inline | 24 | 27.62 | 32 |
| nav-logo-height | 40 | 43.62 | 48 |
| nav-pad-block | 16 | 17.81 | 20 |

Section endpoints already matching a spacing step reference that step
directly: small → space-80, medium → space-112. Grid gutter and field
inline padding reuse space-24 at the extra endpoint. Do not duplicate the
same approved value in parallel scales.

Nav height remains derived from logo height plus two block paddings: 72px at
1440 and 88px at 2500. It needs no independent extra endpoint.

## Containers

- Main content width: 1280px at 1440, 1723.77px at 1920, 2260px at 2500,
  derived from viewport width minus two site margins.
- Cap the main container at its 2500 content width and center it on wider screens.
- Small-container cap: 960px → 1120px. Text line limits in ch remain
  independent and need not expand with the outer container.
- Full-width sections stay at 100%.

## Values that stay fixed

Border width, focus-ring thickness/offset and round-shape behavior do not need
wide-screen scaling. Radii stay capped above 1440; the main radius adapts from
8px on mobile to 16px at the design viewport. Font weights, line-height ratios, tracking in
em and motion durations are outside the spacing scale.

## Implementation

The existing --space-* values use their own clamped 1440–2500 increment.
Spacing min/max values and consumers are retained. Control endpoints were
subsequently aligned with the desktop and mobile Figma controls; field inline
padding now starts at 16px on mobile and reaches the original 24px at 1440.
Field height has its own shared role (56 / 64 / 72px at 360 / 1440 / 2500) so
changes to the distance scale cannot inflate control height. Each growing spacing step
has one extra endpoint; space-4 stays fixed. Small and medium section roles reuse
space-80 and space-112. Site margins, gutters, field padding and nav padding reuse
matching scale endpoints. The remaining independent section roles have their own
extra endpoints. Controls keep their endpoints directly in their existing clamps.
Nav height and the main container cap are derived from shared values.

Edit --space-N-extra in base.css to change the wide endpoint of a shared step.
The token name and --space-N-max remain its exact 1440 design size.

No wide-screen utility family, per-component spacing system or new breakpoint
classes are needed. Verify continuity at 1440, values at 1920/2500, clamping, rem
scaling, preserved 360–1440 behavior and the existing page/interaction checks.
