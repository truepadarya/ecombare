import assert from "node:assert/strict";
import { keepShortWords } from "../src/utils/typography.ts";

assert.equal(
  keepShortWords("for Example Studio in one week"),
  "for\u00a0Example Studio in\u00a0one week",
);
assert.equal(
  keepShortWords("in the app and on the site"),
  "in\u00a0the\u00a0app and\u00a0on\u00a0the\u00a0site",
);
assert.equal(
  keepShortWords("в новом проекте и на сайте"),
  "в\u00a0новом проекте и\u00a0на\u00a0сайте",
);
assert.equal(
  keepShortWords(
    '<a href="/in one" aria-label="in one">in one</a><br />to launch',
  ),
  '<a href="/in one" aria-label="in one">in\u00a0one</a><br />to\u00a0launch',
);
assert.equal(
  keepShortWords("Before analysis: cost &amp; time"),
  "Before analysis: cost &amp; time",
);
assert.equal(
  keepShortWords(keepShortWords("in the app")),
  keepShortWords("in the app"),
);
console.log(
  "Typography passed: short words stay with their next word, markup/attributes are preserved, repeated formatting is stable.",
);
