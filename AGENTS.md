# ecombare

Read LUMOS.md before editing pages, components, styles or media.
Use English for new content, documentation and identifiers.

## Required workflow for site changes

At the start of each site implementation task, read this file and LUMOS.md
before the first edit. Re-read them when resuming after a context reset or
conversation compaction. Inspect the relevant component sources and current
styles instead of relying on remembered APIs or class names.

Build every section on the existing Section/container foundation. Compose its
content with the available ContentWrapper variants, Grid, Heading, Paragraph
and ButtonWrapper as appropriate. Maximize reuse of existing classes throughout
each section, including its responsive layout, spacing, sizing and typography.

Before adding a class or CSS declaration, check component props and variants,
src/styles/patterns.css, src/styles/utilities.css and the tokens in
src/styles/base.css. Use the existing solution whenever it expresses the design.
Add custom CSS only for a specific requirement that these mechanisms cannot
express, following the ownership and cascade rules in LUMOS.md.

Before completing a section, review its markup and added styles for reuse of
the existing foundation. Replace duplicated layout, spacing, typography or
color declarations with the available components, utilities and tokens.

## Shared system

Use the shared Lumos components and existing fluid size and spacing tokens.
Style tokens reference shared primitives; do not duplicate values or utility
families. Heading font-size interpolation and the approved 1440-2500 sizing extension
are project-specific exceptions.
The only font family is Helvetica Neue; the text styles are h1–h6, large, main and small.
Keep the native cursor. Preserve component interactions, keyboard support and
reduced-motion behavior. New visual effects require a specific design task.

Add media with npm run media:add -- --help, register each file once in
src/data/media.ts, and verify both compression and accessible descriptions.
All style-guide and review pages belong to this starter; keep them available.

Start with npm run dev -- --background. Use npm run dev -- status, logs or stop
to manage the server. Run npm run check and npm run build before completion.
Run relevant media, spacing and interaction checks when changing those systems.

Work only in this project. No remote repository or hosting is configured.
Do not publish without an explicit request.

## Reusable foundation

Keep this project a clean, reusable Lumos foundation. Reuse existing tokens,
utilities, variants and components before adding anything. Add a variable only
when an existing token cannot represent a required shared value; never add an
alias or a one-off token merely to relocate a literal. Style tokens must reference
the shared primitive scales. Keep one source of truth and one utility family.
When replacing a mechanism, remove its obsolete definitions, usages, styles,
imports and dependencies. Audit affected consumers before reporting completion.
Approved sizing extensions: stepped heading font sizes and independent
1440-2500 clamps on existing spacing/layout/control tokens. See
docs/wide-spacing-proposal.md.
