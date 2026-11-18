import fs from "node:fs/promises";
import assert from "node:assert/strict";
import postcss from "postcss";

const sizes = [
  4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 64, 68, 72, 80, 88, 96,
  112, 124,
];
const minima = [
  4, 6, 10, 14, 17, 20, 24, 28, 30, 32, 34, 36, 37, 38, 40, 42, 44, 48, 52, 56,
  64, 70,
];
const extras = [
  4, 10, 16, 20, 24, 32, 36, 44, 48, 56, 64, 72, 76, 80, 96, 104, 112, 120, 136,
  144, 168, 184,
];
const base = postcss.parse(await fs.readFile("src/styles/base.css", "utf8"));
const vars = {};
base.walkRules(":root", (rule) => {
  if (rule.parent.type !== "root") return;
  for (const node of rule.nodes)
    if (node.type === "decl") {
      assert.equal(vars[node.prop], undefined, `Duplicate token: ${node.prop}`);
      vars[node.prop] = node.value;
    }
});
const actual = Object.keys(vars)
  .filter((key) => /^--space-\d+$/.test(key))
  .map((key) => Number(key.slice(8)));
assert.deepEqual(actual, sizes);

function evaluate(value, width, tokens = vars) {
  const expanded = value.replace(/var\((--[\w-]+)\)/g, (_, key) => {
    assert.ok(tokens[key], `Unresolved spacing token: ${key}`);
    return `(${evaluateExpression(tokens[key], width, tokens)})`;
  });
  return evaluateExpression(expanded, width, tokens);
}
function evaluateExpression(value, width, tokens) {
  if (value.includes("var(")) return evaluate(value, width, tokens);
  const expression = value
    .replace(/([\d.]+)rem/g, (_, n) => Number(n) * 16)
    .replace(/([\d.]+)vw/g, (_, n) => (Number(n) * width) / 100)
    .replaceAll("calc(", "(");
  assert.match(expression, /^[\d\s.,()+*/a-z-]+$/);
  return Function(
    "clamp",
    "max",
    "min",
    `return ${expression}`,
  )((a, b, c) => Math.max(a, Math.min(b, c)), Math.max, Math.min);
}
for (const [index, size] of sizes.entries()) {
  const key = `--space-${size}`;
  assert.equal(Number(vars[`${key}-max`]), size);
  assert.equal(Number(vars[`${key}-min`]), minima[index]);
  assert.ok(Math.abs(evaluate(vars[key], 360) - minima[index]) < 0.001);
  assert.ok(Math.abs(evaluate(vars[key], 1440) - size) < 0.001);
  let previous = evaluate(vars[key], 360);
  for (let width = 361; width <= 3000; width++) {
    const next = evaluate(vars[key], width);
    const t = Math.max(0, Math.min(1, (width - 1440) / 1060));
    const expected =
      width <= 1440
        ? minima[index] + ((size - minima[index]) * (width - 360)) / 1080
        : size + (extras[index] - size) * t;
    assert.ok(
      Math.abs(next - expected) < 0.001,
      `${key} at ${width}: ${next} != ${expected}`,
    );
    assert.ok(
      next >= previous - 0.001 && next - previous < 0.1,
      `${key} jumps at ${width}`,
    );
    previous = next;
  }
}

const roles = [
  ["site-margin", 16, 80, 120],
  ["site-gutter", 12, 24, 32],
  ["section-space-small", 40, 64, 96],
  ["section-space-medium", 48, 80, 120],
  ["section-space-large", 88, 120, 240],
  ["section-space-nav-overlap", 160, 224, 320],
  ["control-min-height", 48, 48, 56],
  ["field-min-height", 56, 64, 72],
  ["control-icon-size", 44, 44, 48],
  ["control-pad-block", 12, 12, 16],
  ["button-pad-inline", 32, 32, 40],
  ["field-pad-inline", 16, 24, 32],
  ["nav-logo-height", 40, 40, 48],
  ["max-width-small", 960, 960, 1120],
];
for (const [role, min, design, extra] of roles) {
  for (const width of [
    360, 768, 992, 1439, 1440, 1441, 1920, 2499, 2500, 2501, 3000,
  ]) {
    const expected =
      min +
      (design - min) * Math.max(0, Math.min(1, (width - 360) / 1080)) +
      (extra - design) * Math.max(0, Math.min(1, (width - 1440) / 1060));
    assert.ok(
      Math.abs(evaluate(vars[`--${role}`], width) - expected) < 0.001,
      `${role} at ${width}`,
    );
  }
}
for (const width of [360, 768, 1439, 1440, 1441, 1920, 2500, 3000]) {
  const t = Math.max(0, Math.min(1, (width - 1440) / 1060));
  const pad = Math.max(12, Math.min(16, 10.592 + 0.00376 * width)) + 4 * t;
  assert.ok(Math.abs(evaluate(vars["--nav-pad-block"], width) - pad) < 0.001);
  assert.ok(
    Math.abs(evaluate(vars["--nav-height"], width) - (48 + 8 * t + pad * 2)) <
      0.001,
  );
  assert.equal(evaluate(vars["--max-width-main"], width), 2260);
}

const mobileVars = { ...vars };
base.walkRules(":root", (rule) => {
  if (rule.parent.type === "atrule" && rule.parent.params === "(width < 48rem)")
    rule.walkDecls((decl) => {
      mobileVars[decl.prop] = decl.value;
    });
});
for (const [role, expected] of [
  ["section-space-small", 48],
  ["section-space-medium", 56],
  ["section-space-large", 100],
])
  assert.ok(
    Math.abs(evaluate(mobileVars[`--${role}`], 360, mobileVars) - expected) <
      0.001,
    `Approved mobile ${role}`,
  );

const utilities = postcss.parse(
  await fs.readFile("src/styles/utilities.css", "utf8"),
);
const families = [
  "padding",
  "padding-block",
  "padding-inline",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "margin-top",
  "margin-bottom",
  "margin-block",
  "gap",
  "gap-row",
];
for (const family of families) {
  for (const size of sizes) {
    const rules = utilities.nodes.filter(
      (node) => node.type === "rule" && node.selector === `.${family}-${size}`,
    );
    assert.equal(
      rules.length,
      1,
      `Missing/duplicate utility: ${family}-${size}`,
    );
    assert.ok(
      rules[0].nodes.some(
        (node) => node.type === "decl" && node.value === `var(--space-${size})`,
      ),
    );
  }
}
const types = await fs.readFile("src/data/spacing.ts", "utf8");
const steps = [
  ...types.match(/spacingSteps = \[([\s\S]*?)\]/)[1].matchAll(/"(\d+)"/g),
].map((match) => Number(match[1]));
assert.deepEqual(steps, sizes);
const section = await fs.readFile(
  "src/components/wrapper/Section.astro",
  "utf8",
);
assert.ok(section.includes('gap = "64"') && section.includes('gap !== "64"'));
assert.ok(section.includes("SpacingStep"));
const wrapper = await fs.readFile(
  "src/components/wrapper/ButtonWrapper.astro",
  "utf8",
);
assert.ok(wrapper.includes("SpacingStep"));
console.log(
  "Spacing passed: 22 steps at every pixel from 360 to 3000, 264 utilities, semantic roles, derived navigation, exact design values and wide-screen caps.",
);
