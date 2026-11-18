import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { findBrowser } from "./lib/browser-path.mjs";
const run = promisify(execFile);
const work = path.resolve(".cache/theme-colors-check");
await fs.mkdir(work, { recursive: true });
const base = await fs.readFile("src/styles/base.css", "utf8");
const patterns = await fs.readFile("src/styles/patterns.css", "utf8");
const utilities = await fs.readFile("src/styles/utilities.css", "utf8");
const button = (await fs.readFile("src/components/Button.astro", "utf8")).match(
  /<style is:global>([\s\S]*?)<\/style>/,
)[1];
const cases = [
  ["blue", ["accent-blue"], "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
  ["purple", ["accent-purple"], "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
  [
    "dark-blue",
    ["theme-dark", "accent-blue"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  [
    "dark-purple",
    ["theme-dark", "accent-purple"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  [
    "blue-reset",
    ["accent-blue", "theme-light"],
    "rgb(255, 255, 255)",
    "rgb(0, 0, 0)",
  ],
  [
    "purple-reset",
    ["accent-purple", "theme-dark"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  ["default", [], "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
  ["light", ["theme-light"], "rgb(255, 255, 255)", "rgb(0, 0, 0)"],
  ["dark", ["theme-dark"], "rgb(0, 0, 0)", "rgb(255, 255, 255)"],
  ["brand", ["theme-brand"], "rgb(206, 255, 101)", "rgb(0, 0, 0)"],
  [
    "dark-invert",
    ["theme-dark", "theme-invert"],
    "rgb(255, 255, 255)",
    "rgb(0, 0, 0)",
  ],
  [
    "light-invert",
    ["theme-light", "theme-invert"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  [
    "brand-invert",
    ["theme-brand", "theme-invert"],
    "rgb(255, 255, 255)",
    "rgb(0, 0, 0)",
  ],
  [
    "light-dark-invert",
    ["theme-light", "theme-dark", "theme-invert"],
    "rgb(255, 255, 255)",
    "rgb(0, 0, 0)",
  ],
  [
    "dark-light-invert",
    ["theme-dark", "theme-light", "theme-invert"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  [
    "brand-dark",
    ["theme-brand", "theme-dark"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
  [
    "dark-brand",
    ["theme-dark", "theme-brand"],
    "rgb(206, 255, 101)",
    "rgb(0, 0, 0)",
  ],
  [
    "brand-light",
    ["theme-brand", "theme-light"],
    "rgb(255, 255, 255)",
    "rgb(0, 0, 0)",
  ],
  [
    "invert-dark",
    ["theme-light", "theme-invert", "theme-dark"],
    "rgb(0, 0, 0)",
    "rgb(255, 255, 255)",
  ],
];
// Concrete color literals belong to the primitive swatches, never component CSS.
const rootTokens = base.slice(
  base.indexOf(":root {"),
  base.indexOf("/* Color themes */"),
);
const swatches = [...rootTokens.matchAll(/--([\w-]+):\s*(#[0-9a-f]+);/gi)];
assert.equal(swatches.length, 12);
assert.equal(/--red-\d+|#b42318/i.test(base), false);
assert.ok(
  swatches.some(
    ([, name, value]) => name === "brand-500" && value === "#ceff65",
  ),
);
assert.ok(
  swatches.some(
    ([, name, value]) => name === "blue-500" && value === "#5ac9fd",
  ),
);
assert.ok(
  swatches.some(
    ([, name, value]) => name === "purple-500" && value === "#c96eff",
  ),
);
assert.equal(
  /#[0-9a-f]{3,8}\b|\brgba?\(/i.test(
    base.slice(base.indexOf("/* Color themes */")),
  ),
  false,
);
async function auditComponents(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await auditComponents(file);
    else if (file.endsWith(".astro")) {
      const source = await fs.readFile(file, "utf8");
      for (const [, css] of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g))
        assert.equal(
          /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(css),
          false,
          file + " uses hardcoded colors",
        );
    }
  }
}
await auditComponents("src/components");
const markup = cases
  .map(
    ([name, classes]) =>
      classes.map((c) => `<div class="${c}">`).join("") +
      `<section id="${name}"><p class="muted">Muted</p><p class="tag">Tags</p><button class="button_wrap main">Action</button><button class="button_wrap main secondary">Secondary</button><input class="field-control" placeholder="Idea"><span class="border-probe"></span></section>` +
      classes.map(() => "</div>").join(""),
  )
  .join("");
const script = `const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
const rgb=(value,bg)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
window.addEventListener('load',()=>{setTimeout(()=>{window.focus();const results=${JSON.stringify(cases)}.map(([name])=>{const el=document.getElementById(name),s=getComputedStyle(el);const muted=getComputedStyle(el.querySelector('.muted')).color,tag=getComputedStyle(el.querySelector('.tag')).color;const buttons=[...el.querySelectorAll('button')].map(b=>{const idle=getComputedStyle(b),idleBackground=idle.backgroundColor,idleColor=idle.color;b.focus();const c=getComputedStyle(b);return {idleBackground,idleColor,background:c.backgroundColor,color:c.color,outline:c.outlineColor,active:document.activeElement===b,visible:b.matches(":focus-visible")};});const input=el.querySelector('input');const idle=getComputedStyle(input);const field={background:idle.backgroundColor,color:idle.color};input.focus();const active=getComputedStyle(input);field.focusBackground=active.backgroundColor;field.focusColor=active.color;field.outline=active.outlineColor;const border=getComputedStyle(el.querySelector('.border-probe')).borderTopColor;const probe=document.createElement('span');el.append(probe);const role=n=>{probe.style.color='var(--'+n+')';return getComputedStyle(probe).color;};const pairs=['text','text-2','text-3','text-accent','error'].map(n=>[n,rgb(role(n),s.backgroundColor),rgb(s.backgroundColor,s.backgroundColor)]);pairs.push(['tag',rgb(role('tag-text'),role('tag-background')),rgb(role('tag-background'),s.backgroundColor)]);buttons.forEach((b,i)=>pairs.push(['button-'+i,rgb(b.color,b.background),rgb(b.background,s.backgroundColor)],['button-idle-'+i,rgb(b.idleColor,b.idleBackground),rgb(b.idleBackground,s.backgroundColor)]));pairs.push(['field',rgb(field.color,field.background),rgb(field.background,s.backgroundColor)],['field-focus',rgb(field.focusColor,field.focusBackground),rgb(field.focusBackground,s.backgroundColor)],['selection',rgb(role('selection-text'),role('selection-background')),rgb(role('selection-background'),s.backgroundColor)],['focus',rgb(role('focus-color'),s.backgroundColor),rgb(s.backgroundColor,s.backgroundColor)]);const accent=role('accent');probe.remove();return {accent,name,background:s.backgroundColor,color:s.color,muted,tag,buttons,field,border,pairs};});const pre=document.createElement('pre');pre.id='theme-results';pre.textContent=JSON.stringify(results);document.body.append(pre);},100);});`;
let sheet = `@layer base,patterns,components,utilities;@layer base{${base}}@layer patterns{${patterns}}@layer utilities{${utilities}}${button}`;
if (process.argv.includes("--built")) {
  const page = await fs.readFile("dist/color-review/index.html", "utf8");
  const links = [...page.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) =>
      tag.includes('rel="stylesheet"')
        ? tag.match(/href="([^"]+)"/)?.[1]
        : null,
    )
    .filter((href) => href?.startsWith("/_astro/"));
  assert.ok(
    links.length,
    "Build the color review page before testing compiled CSS.",
  );
  sheet = (
    await Promise.all(
      links.map((href) =>
        fs.readFile(path.join("dist", href.slice(1)), "utf8"),
      ),
    )
  ).join("\n");
}
await fs.writeFile(
  path.join(work, "fixture.html"),
  `<!doctype html><meta charset="utf-8"><style>${sheet}*,::before,::after{transition:none!important;animation:none!important}section{background:var(--background);color:var(--text)}.muted{color:var(--text-3)}.tag{color:var(--tag-text)}.border-probe{border-top:1px solid var(--border)}</style>${markup}<script>${script}</script>`,
);
const browser = findBrowser();
const { stdout } = await run(
  browser,
  [
    "--headless",
    "--virtual-time-budget=2000",
    "--disable-backgrounding-occluded-windows",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=" + path.join(work, "profile"),
    "--dump-dom",
    "file:///" + path.join(work, "fixture.html").replaceAll("\\", "/"),
  ],
  { windowsHide: true, timeout: 45000, maxBuffer: 8 * 1024 * 1024 },
);
const found = stdout.match(/<pre id="theme-results">([\s\S]*?)<\/pre>/);
assert.ok(found, "Browser must execute the fixture");
const results = JSON.parse(found[1]);
await fs.writeFile(
  path.join(work, "results.json"),
  JSON.stringify(results, null, 2),
);
const luminance = (rgb) =>
  rgb
    .map((n) => {
      const c = n / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
for (const [name, , bg, text] of cases) {
  const result = results.find((r) => r.name === name);
  assert.equal(result.background, bg, name + " background");
  assert.equal(result.color, text, name + " text");
  assert.equal(
    result.accent,
    name.includes("reset")
      ? "rgb(206, 255, 101)"
      : name.includes("blue")
        ? "rgb(90, 201, 253)"
        : name.includes("purple")
          ? "rgb(201, 110, 255)"
          : "rgb(206, 255, 101)",
    name + " scoped accent",
  );
  for (const [role, fg, bg] of result.pairs) {
    const a = luminance(fg),
      b = luminance(bg),
      ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(
      ratio >= 4.5,
      name + " " + role + " contrast " + ratio.toFixed(2),
    );
  }
  const brand = name === "brand" || name === "dark-brand";
  const dark = bg === "rgb(0, 0, 0)";
  assert.equal(
    result.muted,
    dark ? "rgb(138, 138, 138)" : brand ? "rgb(0, 0, 0)" : "rgb(112, 112, 112)",
    name + " muted",
  );
  assert.equal(
    result.buttons[0].idleBackground,
    brand ? "rgb(0, 0, 0)" : "rgb(206, 255, 101)",
    name + " primary background",
  );
  const focusFill = result.pairs.find(([role]) => role === "button-0")[2];
  const expectedFill = brand ? [255, 255, 255] : [185, 230, 91];
  focusFill.forEach((channel, i) =>
    assert.ok(
      Math.abs(channel - expectedFill[i]) <= 1,
      name + " primary focus",
    ),
  );
  assert.equal(
    result.buttons[0].color,
    "rgb(0, 0, 0)",
    name + " button focus text",
  );
  assert.equal(
    result.buttons[1].background,
    brand ? "rgb(0, 0, 0)" : "rgb(206, 255, 101)",
    name + " secondary focus",
  );
  assert.notEqual(
    result.field.focusBackground,
    result.field.background,
    name + " field state change",
  );
  assert.equal(result.field.focusColor, text, name + " field focus text");
  assert.equal(result.field.outline, text, name + " focus outline");
}
console.log(
  "Chromium: 19 theme/accent contexts passed, including nested theme resets, inversion, text/tag colors, button/field states, selection, focus, contrast >= 4.5 and centralized component colors.",
);
