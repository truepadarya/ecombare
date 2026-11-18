# Partner logos

Source: [Figma logo collection](https://www.figma.com/design/ofeZeqZ9BvoCmGhcd6F9T0/ECOmbare?node-id=1321-1126).

19 canonical logos are retained; the repeated upper strip is excluded.
Each asset is an optimized, vector-only SVG with a 32px intrinsic box height. Horizontal bounds stay tight; vertical
insets balance the visual weight of large wordmarks. The shared Logo component fills its parent height with automatic width.
The owning wrapper defines the size; the review gallery uses space-48. Black artwork is independent of the page theme.

Use `<Logo logo="vizor" />`; use `decorative` when another element provides the
brand name. Accessible names come from src/data/media.ts. Local trusted SVG
markup is rendered on the server so mask and clip IDs can be namespaced per
instance. No client script, raster image, remote reference or per-brand wrapper
is involved. The raw catalog is not an API for user-provided SVG strings.

## Processing

- Removed exported canvas backgrounds and normalized visible bounds.
- Converted colored positive shapes to black.
- Dashin Foundation: inverted positive artwork, retained profile cutouts and
  cropped an isolated antialiased seam from overlapping source clip edges.
- Justin Joy: removed the solid tagline banner and made the lettering black.
- SMT Shipping: retained the circular opening as a true transparent knockout.
- Original masks/clip geometry are preserved. White paint inside luminance
  masks is functional; the rendered artwork is entirely black and transparent.
- Optimized with SVGO. Canonical assets live in src/assets/logo.

## Optical balance

All outer SVG boxes retain their shared height. Only viewBox height, vertical
origin and corresponding intrinsic width change; every artwork contour remains
untouched. Added space above and below is symmetric and transparent. This is
part of the canonical asset, so every Logo instance inherits the correction.

The six detailed logos (Dashin Foundation, AdTech, quadcode, The Island Keeper,
Founders CY and Together Forever) fill the slot. Broad wordmarks occupy roughly
45?67% of its height, centered vertically. At a 48px parent this preserves their
previous visible size while making the detailed logos 50% larger.

Use a wrapper with a definite height, for example:

```astro
<div style="height:var(--space-48)">
  <Logo logo="vizor" />
</div>
```

The same component follows other parent heights without new props or variables.

## Source nodes

| Brand | Canonical file | Figma node |
| --- | --- | --- |
| Brainsome | brainsome.svg | 1321:697 |
| Andrey & Julia Dashin's Foundation | dashin-foundation.svg | 1321:709 |
| AdTech Holding | adtech.svg | 1321:755 |
| VIZOR | vizor.svg | 1321:777 |
| inDrive | indrive.svg | 1321:784 |
| FaceApp | faceapp.svg | 1321:798 |
| quadcode | quadcode.svg | 1321:807 |
| Playrix | playrix.svg | 1321:821 |
| The Island Keeper | island-keeper.svg | 1321:831 |
| BrainRocket | brainrocket.svg | 1321:939 |
| Founders CY | founders-cy.svg | 1321:948 |
| Mellow | mellow.svg | 1321:952 |
| Justin Joy | justin-joy.svg | 1321:960 |
| Exinity | exinity.svg | 1321:994 |
| SMT Shipping | smt-shipping.svg | 1321:1005 |
| Together Forever | together-forever.svg | 1321:1026 |
| Wrike | wrike.svg | 1321:1087 |
| KPMG | kpmg.svg | 1321:1091 |
| Mayflower | mayflower.svg | 1321:1095 |

## Verification

`npm run test:logos` checks unique vector assets, black pixels, transparent
cutouts, horizontal bounds, centered optical insets, equal box heights, aspect ratios, accessible names, scoped
fragment IDs, gallery fit at 360?2500 and 125% rem scaling.
