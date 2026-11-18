# ecombare

A clean Astro starter using the customized Lumos design system.

## Development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev -- --background
```

Manage the server with `npm run dev -- status`, `npm run dev -- logs`, and `npm run dev -- stop`.

## Reference pages

/style-guide, /example-components, /typography-review, /color-review,
/spacing-review, /interaction-review, /motion-review, /media-review.

## Typography

Helvetica Neue is the only font family, with regular, medium and bold weights.
The nine text styles are h1–h6 and paragraph large, main and small.
Shared primitive scales and text-style references live in src/styles/base.css.
Only heading sizes use stepped interpolation; paragraphs use Lumos min/max.

## Media

The project includes neutral placeholders, interface icons and the ecombare partner logos.
The import, optimization, registration, accessible description and validation
workflow is preserved. Read LUMOS.md before adding media.

## Validation

```sh
npm run check
npm run build
npm run test:media-workflow
npm run test:media-descriptions
npm run test:video
npm run test:interactions
npm run test:starter
npm run test:responsive-typography
```

Set SITE_URL and SITE_INDEXABLE explicitly before deployment.
No remote repository or hosting is configured. See LICENSE for the MIT license.
