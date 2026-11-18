import assert from "node:assert/strict";
import fs from "node:fs/promises";
import postcss from "postcss";
import { openBrowser } from "./lib/browser-check.mjs";

const css = await fs.readFile("src/styles/base.css", "utf8");
const root = postcss
  .parse(css)
  .nodes.find((n) => n.type === "rule" && n.selector === ":root");
const tokens = new Map(
  root.nodes.filter((n) => n.type === "decl").map((n) => [n.prop, n.value]),
);
for (const style of [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "text-large",
  "text-main",
  "text-small",
]) {
  assert.match(
    tokens.get("--" + style + "-line-height"),
    /^var\(--line-height-(small|medium|large|huge)\)$/,
  );
  assert.match(
    tokens.get("--" + style + "-letter-spacing"),
    /^var\(--letter-spacing-(tight|snug|normal|wide)\)$/,
  );
  assert.equal(
    tokens.get("--" + style + "-font-family"),
    "var(--primary-family)",
  );
  assert.match(
    tokens.get("--" + style + "-font-weight"),
    /^var\(--primary-(regular|medium|bold)\)$/,
  );
}
assert(
  !/--text-(large|main|small)-(360|992|1440|1920|2500):/.test(css),
  "Paragraphs must use ordinary Lumos min/max sizing",
);
assert.equal(tokens.get("--h6"), "var(--text-main)");
assert(
  !tokens.has("--primary-semibold") && !tokens.has("--control-line-height"),
  "No duplicate primitive aliases",
);
assert.equal(
  root.nodes.filter((n) => n.type === "decl").length,
  tokens.size,
  "No duplicate root tokens",
);

const anchors = [360, 992, 1440, 1920, 2500];
const expected = {
  h1: {
    sizes: [72, 112, 160, 196, 240],
    line: 1.05,
    tracking: -0.04,
    weight: 700,
  },
  h2: {
    sizes: [40, 76, 100, 124, 154],
    line: 1.05,
    tracking: -0.01,
    weight: 700,
  },
  h3: { sizes: [32, 50, 64, 78, 96], line: 1.3, tracking: -0.04, weight: 700 },
  h4: { sizes: [26, 36, 44, 54, 66], line: 1.05, tracking: -0.01, weight: 700 },
  h5: { sizes: [18, 22, 24, 28, 34], line: 1.2, tracking: 0.02, weight: 700 },
  h6: { sizes: [16, 16, 16, 16, 16], line: 1.2, tracking: 0.02, weight: 700 },
  large: {
    sizes: [18, 21.51111111111111, 24, 24, 24],
    line: 1.4,
    tracking: 0,
    weight: 500,
  },
  main: { sizes: [16, 16, 16, 16, 16], line: 1.4, tracking: 0, weight: 500 },
  small: { sizes: [14, 14, 14, 14, 14], line: 1.4, tracking: 0, weight: 500 },
};
const near = (actual, value, label) =>
  assert(
    Math.abs(actual - value) < 0.025,
    label + ": " + actual + " != " + value,
  );
const sizeAt = (values, width) => {
  if (width <= anchors[0]) return values[0];
  for (let i = 1; i < anchors.length; i++)
    if (width <= anchors[i])
      return (
        values[i - 1] +
        ((values[i] - values[i - 1]) * (width - anchors[i - 1])) /
          (anchors[i] - anchors[i - 1])
      );
  return values.at(-1);
};
const browser = await openBrowser();
const base = (process.env.CHECK_URL || "http://localhost:4321").replace(
  /\/$/,
  "",
);
const measure = () =>
  browser.evaluate(
    'Object.fromEntries([...document.querySelectorAll("[data-scale-sample]")].map(e=>{const id=[...e.classList].find(c=>c.startsWith("text-style-")).slice(11);const s=getComputedStyle(e);return [id,{size:parseFloat(s.fontSize),line:parseFloat(s.lineHeight),tracking:parseFloat(s.letterSpacing)||0,weight:Number(s.fontWeight),transform:s.textTransform}]}))',
  );
const viewport = async (width) => {
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.evaluate(
    "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
  );
};
await fs.mkdir(".cache/typography-check", { recursive: true });
try {
  await viewport(1440);
  await browser.call("Page.navigate", { url: base + "/typography-review" });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    ready = await browser.evaluate(
      'document.readyState==="complete"&&document.querySelectorAll("[data-scale-sample]").length===9',
    );
    if (ready) break;
    await browser.wait(100);
  }
  assert(ready, "Typography page did not load");
  await browser.evaluate("document.fonts.ready");
  const fonts = await browser.evaluate(
    '(async()=>{const family=getComputedStyle(document.body).fontFamily.split(",")[0];const loaded=[];for(const weight of [400,500,700]){const faces=await document.fonts.load(weight+" 16px "+family,"ECOmbare Привет");loaded.push({weight,count:faces.length,loaded:faces.every(f=>f.status==="loaded")});}return loaded;})()',
  );
  assert(
    fonts.every((f) => f.count > 0 && f.loaded),
    "Local font faces failed: " + JSON.stringify(fonts),
  );
  const design = await measure();
  for (const [style, metric] of Object.entries(expected)) {
    near(design[style].size, metric.sizes[2], style + " Figma size");
    near(
      design[style].line,
      metric.sizes[2] * metric.line,
      style + " Figma line height",
    );
    near(
      design[style].tracking,
      metric.sizes[2] * metric.tracking,
      style + " Figma tracking",
    );
    assert.equal(design[style].weight, metric.weight, style + " Figma weight");
    assert.equal(
      design[style].transform,
      ["h5", "h6"].includes(style) ? "uppercase" : "none",
      style + " text transform",
    );
  }
  const widths = [
    320, 360, 361, 480, 676, 767, 768, 769, 991, 992, 993, 1216, 1439, 1440,
    1441, 1680, 1919, 1920, 1921, 2210, 2499, 2500, 2501, 3000,
  ];
  for (const width of widths) {
    await viewport(width);
    const actual = await measure();
    for (const [style, metric] of Object.entries(expected))
      near(
        actual[style].size,
        sizeAt(metric.sizes, width),
        style + " at " + width,
      );
    if (anchors.includes(width)) {
      const { data } = await browser.call("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      await fs.writeFile(
        ".cache/typography-check/" + width + ".png",
        Buffer.from(data, "base64"),
      );
    }
  }
  await viewport(1440);
  await browser.call("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  const coarse = await measure();
  for (const style of Object.keys(expected))
    near(
      coarse[style].size,
      design[style].size,
      style + " input-independent size",
    );
  await browser.call("Emulation.setTouchEmulationEnabled", { enabled: false });
  await browser.evaluate('document.documentElement.style.fontSize="125%"');
  await viewport(1800);
  const zoom = await measure();
  for (const style of Object.keys(expected))
    near(
      zoom[style].size,
      expected[style].sizes[2] * 1.25,
      style + " rem scaling",
    );
  await browser.evaluate(
    'document.documentElement.style.removeProperty("font-size")',
  );
  await viewport(1440);
  await browser.evaluate(
    '(()=>{const s=document.documentElement.style;s.setProperty("--h1-1440","164");s.setProperty("--line-height-small","1.15");s.setProperty("--letter-spacing-tight","-.02em");s.setProperty("--primary-bold","500");s.setProperty("--text-main-max","17");const probe=document.createElement("h1");probe.id="token-edit-probe";probe.textContent="Token editing";document.querySelector("main").append(probe);})()',
  );
  const edited = await measure();
  near(edited.h1.size, 164, "Edited central size");
  near(edited.h1.line, 164 * 1.15, "Edited central line height");
  near(edited.h1.tracking, 164 * -0.02, "Edited central tracking");
  assert.equal(edited.h1.weight, 500, "Edited central weight");
  near(edited.h6.size, 17, "H6 follows an edited main token");
  near(edited.h2.line, 100 * 1.15, "H2 follows the shared line-height token");
  near(edited.h4.line, 44 * 1.15, "H4 follows the shared line-height token");
  near(edited.h3.tracking, 64 * -0.02, "H3 follows the shared tracking token");
  for (const style of ["h1", "h2", "h3", "h4", "h5", "h6"])
    assert.equal(
      edited[style].weight,
      500,
      style + " follows the shared weight token",
    );
  const native = await browser.evaluate(
    '(()=>{const s=getComputedStyle(document.getElementById("token-edit-probe"));return {size:parseFloat(s.fontSize),line:parseFloat(s.lineHeight),tracking:parseFloat(s.letterSpacing),weight:Number(s.fontWeight),transform:s.textTransform};})()',
  );
  assert.deepEqual(
    native,
    edited.h1,
    "Native heading and preview share edited tokens",
  );
  console.log(
    "Typography passed: 9 Figma styles at 1440, 24 viewport samples, continuous/clamped growth, local Helvetica Neue 400/500/700, input independence, 125% rem scaling and shared Lumos primitive editing.",
  );
} finally {
  await browser.close();
}
