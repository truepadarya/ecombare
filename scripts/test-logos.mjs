import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { openBrowser } from "./lib/browser-check.mjs";

const files = (await fs.readdir("src/assets/logo")).filter((f) =>
  f.endsWith(".svg"),
);
assert.equal(files.length, 19, "One canonical asset per unique partner");
const hashes = new Set();
for (const file of files) {
  const svg = await fs.readFile("src/assets/logo/" + file, "utf8");
  assert.match(svg, /\bheight="32"/);
  assert.ok(
    !/<(?:image|foreignObject|script|text)\b/i.test(svg),
    file + " stays vector-only",
  );
  assert.ok(
    !/\b(?:href|xlink:href)="(?!#)/i.test(svg),
    file + " has no external asset references",
  );
  const hash = createHash("sha256").update(svg).digest("hex");
  assert.ok(!hashes.has(hash), file + " duplicate asset");
  hashes.add(hash);
  const { data, info } = await sharp(Buffer.from(svg), { density: 576 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1,
    transparent = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 1) {
        assert.ok(
          data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0,
          file + " only has black visible ink",
        );
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      } else transparent++;
    }
  assert.ok(right >= left && bottom >= top, file + " is nonempty");
  assert.ok(
    left <= 3 && right >= info.width - 4,
    file + " has no unnecessary horizontal whitespace",
  );
  assert.ok(
    (bottom - top + 1) / info.height >= 0.44,
    file + " preserves a readable optical size",
  );
  assert.ok(
    Math.abs((top + bottom) / 2 - (info.height - 1) / 2) <= 2,
    file + " artwork is vertically centered",
  );
  if (
    [
      "dashin-foundation.svg",
      "adtech.svg",
      "quadcode.svg",
      "island-keeper.svg",
      "founders-cy.svg",
      "together-forever.svg",
    ].includes(file)
  )
    assert.ok(
      (bottom - top + 1) / info.height > 0.98,
      file + " detailed logo uses the full slot height",
    );
  assert.ok(
    transparent > info.width * info.height * 0.05,
    file + " background stays transparent",
  );
  const [vx, vy, vw, vh] = svg
    .match(/viewBox="([^"]+)"/)[1]
    .split(/\s+/)
    .map(Number);
  const alphaAt = (x, y) =>
    data[
      (Math.floor(((y - vy) / vh) * info.height) * info.width +
        Math.floor(((x - vx) / vw) * info.width)) *
        4 +
        3
    ];
  if (file === "smt-shipping.svg")
    assert.equal(
      alphaAt(31.7735, 8.43944),
      0,
      "SMT circular cutout is genuinely transparent",
    );
  if (file === "dashin-foundation.svg")
    assert.equal(
      alphaAt(70, 20),
      0,
      "Dashin background is genuinely transparent",
    );
  if (file === "justin-joy.svg")
    assert.equal(alphaAt(1, 25), 0, "Justin Joy tagline has no solid banner");
}
const browser = await openBrowser();
try {
  await browser.call("Page.navigate", {
    url: (process.env.CHECK_URL || "http://localhost:4321") + "/media-review",
  });
  for (let i = 0; i < 100; i++) {
    if (
      await browser.evaluate(
        "document.readyState==='complete' && document.querySelectorAll('[data-logo]').length===19",
      )
    )
      break;
    await browser.wait(100);
  }
  await browser.evaluate("document.fonts.ready");
  await fs.mkdir(".cache/logo-check", { recursive: true });
  for (const [width, scale] of [
    [360, 1],
    [768, 1],
    [992, 1],
    [1440, 1],
    [1920, 1],
    [2500, 1],
    [3125, 1.25],
  ]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const result = await browser.evaluate(`(() => {
      document.documentElement.style.fontSize='${scale * 100}%';
      const svgs=[...document.querySelectorAll('[data-logo]')];
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      return {overflow:document.documentElement.scrollWidth>innerWidth,duplicates:ids.length-new Set(ids).size,
        logos:svgs.map(e=>{const r=e.getBoundingClientRect(),p=e.parentElement,card=e.closest('figure'),s=getComputedStyle(card);return {name:e.dataset.logo,height:r.height,parentHeight:p.getBoundingClientRect().height,width:r.width,available:card.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),label:e.getAttribute('aria-label'),role:e.getAttribute('role'),viewBox:e.viewBox.baseVal.width/e.viewBox.baseVal.height,references:[...e.querySelectorAll('*')].flatMap(n=>[...n.attributes].flatMap(a=>[...a.value.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]))).every(id=>!!e.querySelector('[id="'+id+'"]'))};})};
    })()`);
    assert.equal(result.overflow, false, "Page overflow at " + width);
    assert.equal(
      result.duplicates,
      0,
      "Unique SVG IDs when multiple components render",
    );
    assert.equal(result.logos.length, 19);
    assert.equal(
      new Set(result.logos.map((l) => l.name)).size,
      19,
      "No repeated partner entries",
    );
    const effective = width / scale;
    const height =
      scale *
      (36 +
        12 * Math.max(0, Math.min(1, (effective - 360) / 1080)) +
        24 * Math.max(0, Math.min(1, (effective - 1440) / 1060)));
    for (const logo of result.logos) {
      assert.ok(
        Math.abs(logo.height - height) < 0.05,
        logo.name + " equal height at " + width,
      );
      assert.ok(
        Math.abs(logo.height - logo.parentHeight) < 0.05,
        logo.name + " fills parent height",
      );
      assert.ok(
        Math.abs(logo.width / logo.height - logo.viewBox) < 0.01,
        logo.name + " keeps proportions",
      );
      assert.ok(
        logo.width <= logo.available + 0.1,
        logo.name + " fits gallery cell",
      );
      assert.ok(
        logo.label?.trim() && logo.role === "img",
        logo.name + " has an accessible name",
      );
      assert.equal(
        logo.references,
        true,
        logo.name + " resolves masks inside its own SVG",
      );
    }
    if (scale === 1 && (width === 360 || width === 1440)) {
      await browser.evaluate(
        "document.getElementById('partner-logos').scrollIntoView()",
      );
      const { data } = await browser.call("Page.captureScreenshot", {
        format: "png",
      });
      await fs.writeFile(
        ".cache/logo-check/logos-" + width + ".png",
        Buffer.from(data, "base64"),
      );
    }
  }
  const fitted = await browser.evaluate(`(() => {
    const slots=[...document.querySelectorAll('.logo-review_slot')];
    return [24,40,64].map(height=>{slots.forEach(e=>e.style.height=height+'px');const actual=[...document.querySelectorAll('[data-logo]')].map(e=>e.getBoundingClientRect().height);slots.forEach(e=>e.style.removeProperty('height'));return {height,actual};});
  })()`);
  fitted.forEach(({ height, actual }) =>
    actual.forEach((value) =>
      assert.ok(
        Math.abs(value - height) < 0.05,
        "Logo follows arbitrary parent height " + height,
      ),
    ),
  );
  console.log(
    "Logos passed: 19 unique vector assets, black ink, transparent cutouts, centered optical insets, shared box height at 360–2500, 125% rem scaling, aspect ratios, accessible names and scoped SVG IDs.",
  );
} finally {
  await browser.close();
}
