import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const m = "document.querySelector('#case-detail-playrix')";
const s = `${m}.querySelector('[data-modal-scroll]')`;
const until = async (code) => {
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate(code)) return;
    await b.wait(60);
  }
  assert.fail("Timed out: " + code);
};
const snap = async (name) => {
  const r = await b.call("Page.captureScreenshot", { format: "png" });
  await fs.writeFile(
    `.cache/case-popup-check/${name}.png`,
    Buffer.from(r.data, "base64"),
  );
};
try {
  await fs.mkdir(".cache/case-popup-check", { recursive: true });
  await b.call("Page.navigate", { url: base });
  await until(`document.readyState==='complete'&&!!${m}`);
  await b.evaluate("document.fonts.ready");
  assert.equal(
    await b.evaluate(`document.querySelectorAll('[data-case-detail]').length`),
    4,
    "One popup per distinct case on the shared template",
  );
  for (const id of ["brainrocket", "dashin", "playrix", "community"]) {
    const detailId = id === "community" ? "grow-love" : id;
    const dialog = `document.getElementById('case-detail-${detailId}')`;
    await b.evaluate(`document.querySelector('[data-case="${id}"]').click()`);
    await until(`${dialog}.open`);
    await until(
      `getComputedStyle(document.documentElement).overflowY==='hidden'`,
    );
    assert.equal(await b.evaluate(`${dialog}.matches(':modal')`), true);
    assert.equal(
      await b.evaluate(`getComputedStyle(document.documentElement).overflowY`),
      "hidden",
    );
    assert.equal(
      await b.evaluate(
        `${dialog}.querySelector('[data-case-detail]').dataset.caseDetail`,
      ),
      detailId,
    );
    await b.key("Escape");
    await until(`!${dialog}.open`);
    assert.equal(
      await b.evaluate("document.activeElement.dataset.case"),
      id,
      "Focus returns to exact plaque",
    );
  }
  for (const w of [
    360, 375, 479, 480, 767, 768, 1023, 1024, 1440, 1920, 2500,
  ]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.evaluate(`document.querySelector('[data-case="playrix"]').click()`);
    await until(`${m}.open`);
    await b.wait(280);
    await b.evaluate(
      `Promise.all([...${m}.querySelectorAll('article > section:first-child img')].map(e=>e.decode().catch(()=>{})))`,
    );
    const top = await b.evaluate(
      `(()=>{const m=${m},s=${s},h=m.querySelector('article section'),r=h.getBoundingClientRect(),c=m.querySelector('[data-modal-close]').getBoundingClientRect(),i=m.querySelector('.case-detail-intro').getBoundingClientRect();return {width:m.clientWidth,overflow:s.scrollWidth>s.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth,top:r.top,left:r.left,right:r.right,height:r.height,close:c.right<=m.clientWidth&&c.top>=0,intro:i.left>=0&&i.right<=m.clientWidth}})()`,
    );
    assert.equal(top.overflow, false, "No dialog horizontal overflow " + w);
    assert.equal(top.page, false);
    assert.ok(
      Math.abs(top.top) < 1 && Math.abs(top.left) < 1,
      "Edge-to-edge cover " + w,
    );
    assert.ok(top.height >= 899 && top.intro && top.close);
    const metricRows = await b.evaluate(
      `[...${m}.querySelectorAll('[aria-label="Project results"] > *')].map(e=>e.getBoundingClientRect().top)`,
    );
    assert.ok(
      Math.max(...metricRows) - Math.min(...metricRows) < 1,
      "Three results stay in one row at standard text size " + w,
    );
    if ([375, 1440].includes(w)) await snap(`cover-${w}`);
    await b.evaluate(`${s}.scrollTop=900`);
    await b.wait(120);
    if ([375, 1440].includes(w)) await snap(`body-${w}`);
    await b.evaluate(
      `${m}.querySelector('.slider_wrap').scrollIntoView({block:'center',behavior:'instant'})`,
    );
    for (let index = 0; index < 4; index++) {
      await b.evaluate(
        `(()=>{const l=${m}.querySelector('.slider_list');l.scrollTo({left:l.children[${index}].offsetLeft,behavior:'instant'})})()`,
      );
      await b.wait(120);
    }
    await until(
      `[...${m}.querySelectorAll('img')].every(e=>e.complete&&e.naturalWidth>0)`,
    );
    const assets = await b.evaluate(
      `[...${m}.querySelectorAll('img')].map(e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))`,
    );
    assert.equal(assets.length, 7);
    assert.ok(
      assets.every(
        (a) => a.loaded && a.w > 0 && a.h > 0 && !a.src.includes("figma.com"),
      ),
      "All exact local assets " + w,
    );
    const g = await b.evaluate(
      `(()=>{const l=${m}.querySelector('.slider_list');return {vertical:l.scrollHeight-l.clientHeight,travel:l.scrollWidth-l.clientWidth}})()`,
    );
    assert.equal(g.vertical, 0, "Gallery has no vertical scroll");
    assert.ok(g.travel > 0);
    await b.evaluate(`${m}.querySelector('.slider_list').focus()`);
    await b.key("End");
    await b.wait(600);
    assert.ok(
      await b.evaluate(
        `(()=>{const l=${m}.querySelector('.slider_list');return l.scrollLeft>=l.scrollWidth-l.clientWidth-2})()`,
      ),
      "Gallery reaches last image " + w,
    );
    if ([375, 1440].includes(w)) await snap(`gallery-${w}`);
    await b.evaluate(`${m}.querySelector('[data-modal-close]').click()`);
    await until(`!${m}.open`);
    await until(
      `getComputedStyle(document.documentElement).overflowY!=='hidden'`,
    );
    assert.notEqual(
      await b.evaluate("getComputedStyle(document.documentElement).overflowY"),
      "hidden",
    );
    await b.evaluate(`document.querySelector('[data-case="playrix"]').click()`);
    await until(`${m}.open`);
    assert.equal(
      await b.evaluate(`${s}.scrollTop`),
      0,
      "Reopening starts at cover",
    );
    await b.key("Escape");
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 500,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate(
    `document.documentElement.style.fontSize='200%';document.querySelector('[data-case="playrix"]').focus()`,
  );
  await b.key("Enter");
  await until(`${m}.open`);
  await b.wait(100);
  assert.equal(
    await b.evaluate(`${s}.scrollWidth>${s}.clientWidth+1`),
    false,
    "200% text no clipping",
  );
  await b.key("Escape");
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await b.evaluate(`document.querySelector('[data-case="playrix"]').click()`);
  await until(`${m}.open`);
  assert.ok(
    await b.evaluate(
      `parseFloat(getComputedStyle(${m}.querySelector('.modal_content')).transitionDuration)<.001`,
    ),
  );
  await b.key("Escape");
  console.log(
    "Case popup passed: all four plaques open their distinct full-screen Lumos dialogs; exact local assets at 11 widths, edge-to-edge cover, responsive content, gallery keyboard/end, no nested vertical gallery scroll, 200% text, close/Escape/exact focus return, scroll lock and reset, reduced motion.",
  );
} finally {
  await b.close();
}
