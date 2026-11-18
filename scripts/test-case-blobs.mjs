import assert from "node:assert/strict";
import sharp from "sharp";
import { openBrowser } from "./lib/browser-check.mjs";

const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const size = (width, height = 1900) =>
  b.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
const state = () =>
  b.evaluate(
    `(()=>{const scene=document.querySelector('[data-case-scene]');return {height:scene.getBoundingClientRect().height,page:document.documentElement.scrollHeight,keyboard:scene.hasAttribute('data-keyboard'),blobs:[...scene.querySelectorAll('[data-case]')].map(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {id:e.dataset.case,scale:m.a,x:m.e,y:m.f};})};})()`,
  );
const point = (id) =>
  b.evaluate(
    `(()=>{const r=document.querySelector('[data-case="${id}"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`,
  );
const move = (point) =>
  b.call("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
try {
  await size(1440);
  await b.call("Page.navigate", { url: base });
  for (let i = 0; i < 80; i++) {
    if (await b.evaluate("!!document.querySelector('[data-case-scene]')"))
      break;
    await b.wait(80);
  }
  await b.evaluate(
    "document.querySelector('[data-case-gallery]').scrollIntoView({block:'start',behavior:'instant'})",
  );
  await b.wait(400);
  const initial = await state();
  assert.equal(initial.blobs.length, 4);
  assert.ok(
    await b.evaluate(
      "document.querySelector('[data-case=community] [data-case-surface] img').src.includes('community-tree-planting-trimmed')",
    ),
    "Corrected photo without the transparent strip is used by Community",
  );
  assert.equal(
    await b.evaluate(
      "[...document.querySelectorAll('[data-case]')].every(e=>e.tagName==='BUTTON'&&e.type==='button'&&e.getAttribute('aria-label')&&e.getAttribute('aria-haspopup')==='dialog'&&document.getElementById(e.getAttribute('aria-controls')))",
    ),
    true,
  );
  const outside = await b.evaluate(
    "(()=>{const r=document.querySelector('[data-case=brainrocket]').getBoundingClientRect();return{x:5,y:r.top+4};})()",
  );
  await move(outside);
  await b.wait(100);
  assert.equal(
    (await state()).blobs[0].scale,
    1,
    "Empty corner must not trigger hover",
  );
  await move(await point("brainrocket"));
  await b.wait(80);
  const middle = await state();
  assert.ok(
    middle.blobs[0].scale > 1 && middle.blobs[0].scale < 1.08,
    "Growth is animated",
  );
  await b.wait(450);
  const hovered = await state();
  assert.ok(Math.abs(hovered.blobs[0].scale - 1.08) < 0.001);
  assert.ok(hovered.blobs[1].x > 5, "Adjacent shape is pushed outward");
  assert.equal(hovered.height, initial.height);
  assert.equal(hovered.page, initial.page, "Hover must not shift the page");
  await move(await point("dashin"));
  await b.wait(90);
  await move(await point("brainrocket"));
  await b.wait(450);
  assert.ok(
    Math.abs((await state()).blobs[0].scale - 1.08) < 0.001,
    "Interrupted hover settles correctly",
  );
  await move({ x: 10, y: 10 });
  await b.wait(500);
  (await state()).blobs.forEach((e) => {
    assert.equal(e.scale, 1);
    assert.equal(e.x, 0);
    assert.equal(e.y, 0);
  });
  await b.evaluate("document.querySelector('[data-case=brainrocket]').focus()");
  await b.key("Tab");
  assert.equal(
    await b.evaluate("document.activeElement.dataset.case"),
    "dashin",
  );
  assert.equal((await state()).keyboard, true);
  assert.ok(
    Math.abs((await state()).blobs[1].scale - 1.08) < 0.001,
    "Keyboard focus is immediate",
  );
  assert.equal(
    await b.evaluate("getComputedStyle(document.activeElement).outlineStyle"),
    "none",
    "No rectangular focus box around a masked plaque",
  );
  assert.ok(
    await b.evaluate(
      "getComputedStyle(document.activeElement).filter.includes('drop-shadow')",
    ),
    "Keyboard focus follows the painted mask",
  );
  await b.evaluate("document.activeElement.blur()");
  await move({ x: 10, y: 10 });
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await move(await point("brainrocket"));
  await b.wait(80);
  (await state()).blobs.forEach((e) => {
    assert.equal(e.scale, 1);
    assert.equal(e.x, 0);
    assert.equal(e.y, 0);
  });
  await b.call("Emulation.setEmulatedMedia", { features: [] });
  await move({ x: 10, y: 10 });
  for (const width of [360, 375, 768, 1024, 1440, 2500]) {
    await size(width, width < 768 ? 1100 : width === 2500 ? 3000 : 1900);
    await b.evaluate(
      "document.querySelector('[data-case-gallery]').scrollIntoView({block:'start',behavior:'instant'})",
    );
    await b.wait(200);
    assert.equal(
      await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
      false,
      "No overflow at " + width,
    );
    const loaded = await b.evaluate(
      "Promise.all([...document.querySelectorAll('[data-case-scene] img')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.decode().then(()=>true,()=>false)))",
    );
    loaded.forEach((v) => assert.equal(v, true));
    assert.equal(
      await b.evaluate(
        "[...document.querySelectorAll('[data-case]')].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0})",
      ),
      true,
    );
    if ([375, 1440].includes(width)) {
      await b.evaluate("document.querySelector('astro-dev-toolbar')?.remove()");
      const crop = await b.evaluate(
        "(()=>{const r=document.querySelector('[data-case-gallery]').getBoundingClientRect();return{left:0,top:Math.max(0,Math.round(r.top)),width:document.documentElement.clientWidth,height:Math.min(innerHeight-Math.max(0,Math.round(r.top)),Math.round(r.height))};})()",
      );
      const s = await b.call("Page.captureScreenshot", { format: "png" });
      await sharp(Buffer.from(s.data, "base64"))
        .extract(crop)
        .toFile(`.cache/case-blobs-${width}.png`);
    }
  }
  await size(360, 1000);
  await b.evaluate("document.documentElement.style.fontSize='200%'");
  await b.wait(100);
  assert.equal(
    await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
    "200% text does not overflow",
  );
  await b.evaluate("document.documentElement.style.fontSize=''");
  await size(1440, 1000);
  await b.wait(100);
  assert.equal(
    await b.evaluate(
      "getComputedStyle(document.documentElement).scrollbarWidth",
    ),
    "auto",
    "Native scrollbar",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('.eco-footer-brand').closest('a')",
    ),
    null,
    "Footer logo is not a link",
  );
  assert.equal(
    await b.evaluate("document.querySelector('.eco-footer-bottom a').href"),
    "https://69pixels.com/",
  );
  const lines = await b.evaluate(
    `(()=>{const e=document.querySelector('#quote blockquote .text'),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),rows=new Map();while(w.nextNode()){const n=w.currentNode;for(let i=0;i<n.length;i++){const r=new Range();r.setStart(n,i);r.setEnd(n,i+1);const b=r.getBoundingClientRect();if(!b.width||!b.height)continue;const y=Math.round(b.top);rows.set(y,(rows.get(y)||'')+n.data[i]);}}return [...rows.values()].map(s=>s.replace(/\\s+/g,' ').trim()).filter(Boolean);})()`,
  );
  assert.deepEqual(lines, [
    "Our Signature Programs \u2014 for",
    "companies and individuals. Each one",
    "designed to get people outside, create",
    "measurable impact.",
  ]);
  console.log(
    "Case blobs passed: real-shape hover, animated growth and neighbor push, interruption/reset without drift or page shifts, keyboard, reduced motion, images at 360-2500 and 200% text. Native scrollbar, footer links and exact four quote lines verified.",
  );
} finally {
  await b.close();
}
