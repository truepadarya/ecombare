import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const root = "document.querySelector('[data-team-scroll]')";
const viewport = "document.querySelector('[data-team-viewport]')";
const video = "document.querySelector('#team video')";
const until = async (expression) => {
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate(expression)) return;
    await b.wait(50);
  }
  assert.fail("Timed out: " + expression);
};
const go = async (offset = 0) => {
  await b.evaluate(
    `(()=>{const r=${root};window.scrollTo({top:r.getBoundingClientRect().top+scrollY+${offset},behavior:'instant'})})()`,
  );
  await b.wait(100);
};
const navigate = async (width = 1440, height = 1000, scale = 1) => {
  await b.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.call("Page.navigate", { url: base });
  await until(`document.readyState==='complete'&&!!${viewport}`);
  await b.evaluate(`document.documentElement.style.fontSize='${scale * 100}%'`);
  await b.evaluate("document.fonts.ready");
  await b.wait(100);
  await go();
};
const state = () =>
  b.evaluate(
    `(()=>{const r=${root},v=${viewport},s=r.querySelector('.team-stage'),c=r.querySelector('.container'),cards=[...r.querySelectorAll('.team-slide')],rect=v.getBoundingClientRect();return {pinned:r.hasAttribute('data-pinned'),rootHeight:r.offsetHeight,stageHeight:s.offsetHeight,top:s.getBoundingClientRect().top,travel:v.scrollWidth-v.clientWidth,x:v.scrollLeft,vertical:v.scrollHeight-v.clientHeight,scrollTop:v.scrollTop,overflow:document.documentElement.scrollWidth>innerWidth,count:cards.length,center:c.getBoundingClientRect().top+c.offsetHeight/2,targetCenter:innerHeight/2+(parseFloat(getComputedStyle(r.querySelector("section")).paddingTop)-parseFloat(getComputedStyle(r.querySelector("section")).paddingBottom))/2,mediaTops:cards.map(e=>e.querySelector('.team-video_mask').getBoundingClientRect().top),captionTops:cards.map(e=>e.querySelector('figcaption').getBoundingClientRect().top),lastRight:cards.at(-1).getBoundingClientRect().right,viewportRight:rect.right,pad:parseFloat(getComputedStyle(v).paddingRight),heading:r.querySelector('h2').getBoundingClientRect().top,arrows:r.querySelectorAll('[data-step],.slider_controls,.slider_marker').length};})()`,
  );
try {
  await fs.mkdir(".cache/team-check", { recursive: true });
  for (const width of [
    360, 375, 479, 480, 767, 768, 1023, 1024, 1440, 1920, 2500,
  ]) {
    await navigate(width);
    const a = await state();
    assert.equal(
      a.pinned,
      width >= 1024,
      "Desktop pin / mobile native row at " + width,
    );
    assert.equal(a.count, 6);
    assert.equal(a.arrows, 0);
    assert.equal(a.overflow, false);
    assert.equal(a.vertical, 0, "No nested vertical scrolling at " + width);
    assert.ok(Math.max(...a.mediaTops) - Math.min(...a.mediaTops) < 1);
    assert.ok(Math.max(...a.captionTops) - Math.min(...a.captionTops) < 1);
    assert.ok(a.mediaTops[0] >= 0, "Uncut portrait tops");
    if (width < 1024) {
      await go(200);
      assert.equal(
        (await state()).x,
        a.x,
        "Vertical page scroll does not move the mobile row",
      );
      await b.evaluate(`${viewport}.focus()`);
      await b.key("End");
      await b.wait(150);
      assert.ok(
        Math.abs((await state()).x - a.travel) < 2,
        "Native row can reach the last member",
      );
      continue;
    }
    assert.ok(
      Math.abs(a.center - a.targetCenter) < 2,
      "Balanced top and bottom spacing at " + width,
    );
    await go(a.travel * 0.5);
    const middle = await state();
    assert.ok(Math.abs(middle.top) < 2);
    assert.ok(Math.abs(middle.x - a.travel * 0.5) < 2);
    assert.ok(Math.abs(middle.heading - a.heading) < 2);
    await go(a.travel);
    const end = await state();
    assert.ok(Math.abs(end.x - a.travel) < 2);
    assert.ok(
      end.lastRight <= end.viewportRight - end.pad + 2,
      "Last portrait completely visible",
    );
    await go(a.travel + 100);
    assert.ok(
      (await state()).top < -98,
      "Normal page scrolling after the last card",
    );
    await go(a.travel * 0.25);
    assert.ok(
      Math.abs((await state()).x - a.travel * 0.25) < 2,
      "Reverse scroll follows progress",
    );
    await b.evaluate(`${viewport}.scrollTop=100`);
    assert.equal((await state()).scrollTop, 0);
    await b.evaluate(`${viewport}.focus()`);
    await b.key("End");
    await b.wait(100);
    assert.ok(Math.abs((await state()).x - a.travel) < 2);
    await b.key("Tab");
    await b.wait(100);
    assert.equal(
      await b.evaluate(
        "document.activeElement.dataset.teamVideoTrigger!==undefined",
      ),
      true,
    );
    assert.ok((await state()).x < 2, "Tab brings first card back into view");
    await b.evaluate("document.activeElement.blur()");
    if ([375, 1440].includes(width)) {
      await go();
      await b.evaluate("document.querySelector('astro-dev-toolbar')?.remove()");
      await b.evaluate(
        "Promise.all([...document.querySelectorAll('#team img')].filter(e=>e.getBoundingClientRect().left<innerWidth).map(e=>e.decode().catch(()=>{})))",
      );
      const shot = await b.call("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(
        `.cache/team-check/team-${width}.png`,
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  await navigate(1440, 887);
  const cap = await state();
  assert.ok(cap.pinned);
  assert.ok(Math.abs(cap.center - cap.targetCenter) < 2);
  await navigate(1440, 400);
  assert.equal(
    (await state()).pinned,
    false,
    "Short screen uses natural layout",
  );
  assert.equal((await state()).vertical, 0);
  await navigate(375, 900, 2);
  assert.equal((await state()).overflow, false);
  assert.equal((await state()).vertical, 0);
  await b.evaluate(`${viewport}.focus()`);
  await b.key("End");
  await b.wait(100);
  assert.ok(
    (await state()).x > 0,
    "Enlarged text fallback keeps every member accessible",
  );
  await navigate(1440);
  await b.call("Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: 700,
    y: 500,
    deltaX: 0,
    deltaY: 220,
  });
  await until(`${viewport}.scrollLeft>100`);
  assert.ok(Math.abs((await state()).top) < 2, "Wheel keeps the scene pinned");
  await b.wait(1500);
  await b.call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 3, y: 3 });
  await go();
  const corner = await b.evaluate(
    "(()=>{const r=document.querySelector('[data-team-video-trigger]').getBoundingClientRect();return{x:r.left+3,y:r.top+3};})()",
  );
  await b.call("Input.dispatchMouseEvent", { type: "mouseMoved", ...corner });
  await b.wait(100);
  assert.equal(
    await b.evaluate(`${video}.paused`),
    true,
    "Transparent corners do not play",
  );
  const point = await b.evaluate(
    "(()=>{const r=document.querySelector('[data-team-video-trigger]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()",
  );
  await b.call("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
  await until(`!${video}.paused`);
  await until(`Number.isFinite(${video}.duration)&&${video}.readyState>=2`);
  assert.equal(await b.evaluate(`${video}.playbackRate`), 1.5);
  await b.evaluate(`${video}.currentTime=${video}.duration-.15`);
  await until(`${video}.ended`);
  await b.wait(250);
  assert.equal(
    await b.evaluate(`${video}.ended`),
    true,
    "Continuous hover does not restart completed video",
  );
  await go(100);
  await b.wait(100);
  assert.equal(await b.evaluate(`${video}.paused`), true);
  assert.equal(
    await b.evaluate(`${video}.currentTime`),
    0,
    "Scroll restores the poster state",
  );
  await b.call("Input.dispatchMouseEvent", { type: "mouseMoved", x: 3, y: 3 });
  await go();
  await b.evaluate(
    "document.querySelector('[data-team-video-trigger]').focus()",
  );
  await b.key("Enter");
  await until(`!${video}.paused`);
  await b.key(" ");
  await until(`${video}.paused`);
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await b.wait(150);
  assert.equal((await state()).pinned, false);
  await b.evaluate(`${viewport}.focus()`);
  await b.key("End");
  await b.wait(100);
  const end = await state();
  assert.ok(end.x > 0);
  assert.ok(end.lastRight <= end.viewportRight - end.pad + 2);
  console.log(
    "Team passed: sticky centering and complete horizontal traversal at 11 widths, release and reverse, no arrows/vertical clipping, keyboard focus, short-screen and enlarged-text fallbacks, reduced motion, exact-shape hover, video speed/end/poster and keyboard playback.",
  );
} finally {
  await b.close();
}
