import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";

const browser = await openBrowser();
const base = (process.env.CHECK_URL || "http://localhost:4321").replace(
  /\/$/,
  "",
);
const routes = [
  "/",
  "/style-guide",
  "/example-components",
  "/typography-review",
  "/color-review",
  "/spacing-review",
  "/interaction-review",
  "/motion-review",
  "/media-review",
];
await fs.mkdir(".cache/starter-check", { recursive: true });
try {
  await browser.call("Page.navigate", { url: base + "/spacing-review" });
  for (let i = 0; i < 100; i++) {
    if (
      await browser.evaluate(
        '!!document.querySelector(".spacing-review_wrap") && document.readyState === "complete"',
      )
    )
      break;
    await browser.wait(100);
  }
  const spacing = [
    [4, 4, 4],
    [8, 6, 10],
    [12, 10, 16],
    [16, 14, 20],
    [20, 17, 24],
    [24, 20, 32],
    [28, 24, 36],
    [32, 28, 44],
    [36, 30, 48],
    [40, 32, 56],
    [44, 34, 64],
    [48, 36, 72],
    [52, 37, 76],
    [56, 38, 80],
    [64, 40, 96],
    [68, 42, 104],
    [72, 44, 112],
    [80, 48, 120],
    [88, 52, 136],
    [96, 56, 144],
    [112, 64, 168],
    [124, 70, 184],
  ];
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
  for (const [width, scale] of [
    [360, 1],
    [768, 1],
    [1439, 1],
    [1440, 1],
    [1441, 1],
    [1920, 1],
    [2499, 1],
    [2500, 1],
    [2501, 1],
    [3000, 1],
    [3125, 1.25],
  ]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const result = await browser.evaluate(`(() => {
      document.documentElement.style.fontSize = '${scale * 100}%';
      const host = document.createElement('div'); host.style.cssText = 'position:absolute;visibility:hidden;width:100vw;left:0;top:0'; document.body.append(host);
      const measure = (name, step) => { const e=document.createElement('div'); e.style.width='var(--'+name+')'; host.append(e); const width=parseFloat(getComputedStyle(e).width); if(step)e.className='padding-'+step+' margin-top-'+step+' gap-'+step; host.append(e); const s=getComputedStyle(e); return [width,parseFloat(s.paddingLeft),parseFloat(s.marginTop),parseFloat(s.gap)]; };
      const steps=${JSON.stringify(spacing)}.map(([step])=>measure('space-'+step,step));
      const roles=${JSON.stringify(roles)}.map(([name])=>measure(name)[0]);
      const c=document.createElement('div'); c.className='container'; host.append(c); const r=c.getBoundingClientRect();
      const nav=measure('nav-height')[0]; host.remove(); return {steps,roles,container:[r.width,r.left],nav};
    })()`);
    const effective = width / scale;
    const t = Math.max(0, Math.min(1, (effective - 1440) / 1060));
    const expected = (min, design, extra) =>
      scale *
      (min +
        (design - min) * Math.max(0, Math.min(1, (effective - 360) / 1080)) +
        (extra - design) * t);
    const near = (actual, value, label) =>
      assert.ok(
        Math.abs(actual - value) < 0.06,
        `${label} at ${width}/${scale}: ${actual} != ${value}`,
      );
    spacing.forEach(([design, min, extra], i) =>
      result.steps[i].forEach((value) =>
        near(value, expected(min, design, extra), `space/utility-${design}`),
      ),
    );
    roles.forEach(([name, min, design, extra], i) =>
      near(result.roles[i], expected(min, design, extra), name),
    );
    const content = Math.min(width - 2 * expected(16, 80, 120), 2260 * scale);
    near(result.container[0], content, "container width");
    near(result.container[1], (width - content) / 2, "container centering");
    const navPad =
      Math.max(12, Math.min(16, 10.592 + 0.00376 * effective)) + 4 * t;
    near(result.nav, scale * (48 + 8 * t + navPad * 2), "derived nav height");
  }
  await browser.evaluate(
    "document.documentElement.style.removeProperty('font-size')",
  );
  console.log(
    "Browser spacing passed: all 22 tokens and padding/margin/gap consumers, semantic roles, 1440/2500 boundaries, container centering and 125% rem scaling.",
  );
  for (const width of [360, 768, 992, 1440, 1920, 2500]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const route of routes) {
      await browser.call("Page.navigate", { url: base + route });
      let ready = false;
      for (let i = 0; i < 100; i++) {
        ready = await browser.evaluate(
          'location.pathname.replace(/\\/$/,"") === ' +
            JSON.stringify(route === "/" ? "" : route) +
            ' && document.readyState === "complete" && !!document.querySelector("main :is(h1,h2)")',
        );
        if (ready) break;
        await browser.wait(100);
      }
      assert(ready, "Page did not load: " + route);
      await browser.evaluate("document.fonts.ready");
      await browser.wait(150);
      const result = await browser.evaluate(
        '(() => { const elements = [...document.querySelectorAll("body *")]; const textElements = elements.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).display !== "none"); return { overflow: document.documentElement.scrollWidth > innerWidth, fonts: [...new Set(textElements.map(e => getComputedStyle(e).fontFamily))], hiddenCursor: elements.some(e => getComputedStyle(e).cursor === "none"), effects: elements.filter(e => { const s=getComputedStyle(e); return s.textShadow !== "none" || s.boxShadow !== "none" || s.filter.includes("drop-shadow"); }).map(e => e.className), brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src), styles: [...document.querySelectorAll("[data-scale-sample]")].map(e => [...e.classList].find(c => /^text-style-/.test(c))) }; })()',
      );
      assert.equal(result.overflow, false, route + " overflow at " + width);
      assert.equal(
        result.fonts.length,
        1,
        route + " font families: " + result.fonts,
      );
      assert.equal(result.hiddenCursor, false, route + " hides cursor");
      assert.deepEqual(result.effects, [], route + " visual effects");
      assert.deepEqual(result.brokenImages, [], route + " missing image");
      if (route === "/interaction-review") {
        const rows = await browser.evaluate(
          "[...document.querySelectorAll('#fields-light input[type=email]')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y}})",
        );
        assert.equal(rows.length, 3, "Input states stay together");
        if (width >= 768) {
          assert.ok(
            rows[0].x < rows[1].x && rows[1].x < rows[2].x,
            "State columns at " + width,
          );
          assert.ok(
            Math.abs(rows[0].y - rows[2].y) < 1,
            "State rows align at " + width,
          );
        } else {
          assert.ok(
            Math.abs(rows[0].x - rows[2].x) < 1 &&
              rows[0].y < rows[1].y &&
              rows[1].y < rows[2].y,
            "State comparison stacks on mobile",
          );
        }
      }
      if (route === "/spacing-review") {
        assert.equal(
          await browser.evaluate(
            "document.querySelector('.spacing-review_table').open",
          ),
          false,
          "Reference endpoints start collapsed",
        );
        assert.equal(
          await browser.evaluate(
            "document.querySelectorAll('.spacing-review_table tbody tr').length",
          ),
          22,
          "All reference endpoints remain available",
        );
        const controls = await browser.evaluate(`(() => {
          const panel=document.querySelector('.geometry-review_panel');
          return {buttons:[...panel.querySelectorAll('.button_wrap')].map(e=>({height:e.getBoundingClientRect().height,radius:parseFloat(getComputedStyle(e).borderRadius),icon:e.matches('.arrow,.play,.close'),link:e.matches('.link')})), fields:[...panel.querySelectorAll('.field-control')].map(e=>({height:e.getBoundingClientRect().height,radius:parseFloat(getComputedStyle(e).borderRadius)}))};
        })()`);
        const t = Math.max(0, Math.min(1, (width - 1440) / 1060));
        for (const button of controls.buttons) {
          assert.ok(
            Math.abs(
              button.height -
                (button.icon || button.link ? 44 + 4 * t : 48 + 8 * t),
            ) < 0.1,
            "Shared button geometry at " + width,
          );
          if (!button.icon && !button.link) assert.equal(button.radius, 8);
        }
        assert.ok(
          Math.abs(
            controls.fields[0].radius -
              (8 + 8 * Math.max(0, Math.min(1, (width - 360) / 1080))),
          ) < 0.01,
        );
        controls.fields.forEach((field) =>
          assert.ok(field.height >= 44, "Field touch target at " + width),
        );
        const fieldHeight =
          56 + 8 * Math.max(0, Math.min(1, (width - 360) / 1080)) + 8 * t;
        controls.fields.forEach((field) =>
          assert.ok(
            Math.abs(field.height - fieldHeight) < 0.05,
            "Independent field height at " + width,
          ),
        );
        if (width === 1440)
          controls.fields.forEach((field) =>
            assert.equal(field.height, 64, "Unified field height at 1440"),
          );
        const longContent = await browser.evaluate(`(() => {
          const panel=document.querySelector('.geometry-review_panel');const button=panel.querySelector('.button_wrap').cloneNode(true);button.querySelector('.button_text').textContent='Averylonglabelwithoutspaces'.repeat(20);panel.append(button);const label=panel.querySelector('.field').cloneNode(true);label.querySelector('.field-label span').textContent='Longfieldlabelwithoutspaces'.repeat(20);panel.append(label);const result={buttonWidth:button.getBoundingClientRect().width,panelWidth:panel.clientWidth,buttonHeight:button.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth};button.remove();label.remove();return result;
        })()`);
        assert.ok(
          longContent.buttonWidth <= longContent.panelWidth &&
            longContent.buttonHeight > 48,
          "Long button label wraps at " + width,
        );
        assert.equal(
          longContent.overflow,
          false,
          "Long field labels at " + width,
        );
      }
      if (route === "/color-review") {
        const transparent = await browser.evaluate(
          'getComputedStyle(document.querySelector(".theme-dark.background-transparent")).backgroundColor',
        );
        assert.equal(
          transparent,
          "rgba(0, 0, 0, 0)",
          "Media context keeps its background transparent",
        );
      }
      if (route === "/spacing-review" || route === "/color-review") {
        const { data } = await browser.call("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
        });
        await fs.writeFile(
          ".cache/starter-check/" +
            (route === "/color-review" ? "color-" : "spacing-") +
            width +
            ".png",
          Buffer.from(data, "base64"),
        );
      }
      if (route === "/typography-review") {
        assert.deepEqual(
          new Set(result.styles),
          new Set(
            ["h1", "h2", "h3", "h4", "h5", "h6", "large", "main", "small"].map(
              (s) => "text-style-" + s,
            ),
          ),
        );
        const { data } = await browser.call("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
        });
        await fs.writeFile(
          ".cache/starter-check/typography-" + width + ".png",
          Buffer.from(data, "base64"),
        );
      }
    }
    console.log(
      "Starter pages passed at " +
        width +
        "px: all 9 routes, one font, nine text styles, native cursor, no visual effects or broken images, no horizontal overflow.",
    );
  }
} finally {
  await browser.close();
}
