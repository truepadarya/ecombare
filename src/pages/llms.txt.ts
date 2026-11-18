import { SITE_NAME, SITE_DESCRIPTION } from "@/consts";

export function GET() {
  return new Response(
    `# ${SITE_NAME}

${SITE_DESCRIPTION}

Lumos reference pages: /style-guide, /example-components, /typography-review, /color-review, /spacing-review, /interaction-review, /motion-review, /media-review.
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
