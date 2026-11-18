import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const video = "document.querySelector('.eco-footer video')";
const waitFor = async (expression) => {
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate(expression)) return;
    await b.wait(50);
  }
  assert.fail("Timed out: " + expression);
};
try {
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.call("Page.navigate", { url: base });
  await waitFor(
    "document.readyState==='complete' && !!document.querySelector('.eco-footer')",
  );
  await b.evaluate("document.fonts.ready");
  assert.equal(
    await b.evaluate(`${video}.paused`),
    true,
    "Offscreen video starts paused",
  );
  assert.equal(await b.evaluate(`${video}.currentTime`), 0);
  assert.equal(
    await b.evaluate("document.querySelector('.eco-footer').closest('main')"),
    null,
    "Footer is outside main",
  );
  assert.equal(
    await b.evaluate(
      "[...document.querySelectorAll('.eco-footer a[href^=\"#\"]')].every(a=>document.querySelector(a.getAttribute('href')))",
    ),
    true,
    "All navigation anchors exist",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelectorAll('[aria-labelledby=footer-social-heading] a[href^=\"https://\"]').length",
    ),
    3,
    "Only verified social links",
  );
  await b.evaluate(
    "document.querySelector('.eco-footer').scrollIntoView({block:'end',behavior:'instant'})",
  );
  await waitFor(`${video}.currentTime>.1 && !${video}.paused`);
  assert.equal(await b.evaluate(`${video}.playbackRate`), 1);
  assert.equal(await b.evaluate(`${video}.loop`), false);
  const start = await b.evaluate(`${video}.currentTime`);
  await b.wait(600);
  const delta = (await b.evaluate(`${video}.currentTime`)) - start;
  assert.ok(delta > 0.35 && delta < 0.95, "Original playback speed: " + delta);
  await b.evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await waitFor(`${video}.paused`);
  const paused = await b.evaluate(`${video}.currentTime`);
  await b.wait(250);
  assert.equal(
    await b.evaluate(`${video}.currentTime`),
    paused,
    "No playback outside viewport",
  );
  await b.evaluate(
    "document.querySelector('.eco-footer').scrollIntoView({block:'end',behavior:'instant'})",
  );
  await waitFor(`!${video}.paused`);
  await b.evaluate(`${video}.currentTime=${video}.duration-.2`);
  await waitFor(`${video}.ended`);
  const end = await b.evaluate(`${video}.currentTime`);
  await b.wait(600);
  assert.equal(
    await b.evaluate(`${video}.currentTime`),
    end,
    "Last frame stays displayed",
  );
  await b.evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await b.wait(100);
  await b.evaluate(
    "document.querySelector('.eco-footer').scrollIntoView({block:'end',behavior:'instant'})",
  );
  await b.wait(200);
  assert.equal(
    await b.evaluate(`${video}.ended`),
    true,
    "Re-entering does not replay a finished video",
  );
  for (const width of [360, 375, 768, 1024, 1440, 2500]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.wait(100);
    const geometry = await b.evaluate(
      `(()=>{const f=document.querySelector('.eco-footer'),r=f.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,width:r.width,available:document.documentElement.clientWidth,images:[...f.querySelectorAll('img')].map(e=>({loaded:e.complete&&e.naturalWidth>0,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))};})()`,
    );
    assert.equal(geometry.overflow, false, "No page overflow at " + width);
    assert.equal(geometry.width, geometry.available, "Full width at " + width);
    geometry.images.forEach((e) => {
      assert.ok(e.loaded);
      assert.ok(e.width > 0 && e.height > 0);
    });
    if ([375, 1440].includes(width)) {
      await b.evaluate(
        "document.querySelector('astro-dev-toolbar')?.remove();document.querySelector('.eco-footer').scrollIntoView({block:'end',behavior:'instant'})",
      );
      await b.wait(100);
      const shot = await b.call("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(
        `.cache/footer-${width}.png`,
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate("document.documentElement.style.fontSize='200%'");
  await b.wait(100);
  assert.equal(
    await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
    "200% text remains in viewport",
  );
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await b.call("Page.reload");
  await waitFor("!!document.querySelector('.eco-footer video')");
  await b.evaluate(
    "document.querySelector('.eco-footer').scrollIntoView({block:'end',behavior:'instant'})",
  );
  await b.wait(600);
  assert.equal(
    await b.evaluate(`${video}.paused`),
    true,
    "Reduced motion suppresses autoplay",
  );
  console.log(
    "Home footer passed: original speed, viewport start/pause, no loop, final-frame hold and no replay; 360-2500 geometry, SVG assets, working anchors, verified social links, 200% text and reduced motion.",
  );
} finally {
  await b.close();
}
