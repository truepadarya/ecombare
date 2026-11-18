import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser(),
  base = process.env.CHECK_URL || "http://localhost:4321";
const until = async (s) => {
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate(s)) return;
    await b.wait(50);
  }
  assert.fail(s);
};
const state = () =>
  b.evaluate(
    `(()=>{let m=document.querySelector('#case-detail-playrix'),s=m.querySelector('[data-modal-scroll]'),r=m.querySelector('[data-case-photo-scroll]'),stage=r.firstElementChild,l=r.querySelector('.slider_list');return{pinned:r.hasAttribute('data-pinned'),start:r.getBoundingClientRect().top-s.getBoundingClientRect().top+s.scrollTop-parseFloat(getComputedStyle(stage).top),target:parseFloat(getComputedStyle(stage).top),stageHeight:stage.offsetHeight,gap:l.getBoundingClientRect().top-stage.querySelectorAll("p")[stage.querySelectorAll("p").length-1].getBoundingClientRect().bottom,photosBottom:l.getBoundingClientRect().bottom,travel:l.scrollWidth-l.clientWidth,x:l.scrollLeft,top:stage.getBoundingClientRect().top,vertical:l.scrollHeight-l.clientHeight,y:s.scrollTop,height:r.offsetHeight,last:l.lastElementChild.getBoundingClientRect().right,right:l.getBoundingClientRect().right}})()`,
  );
const go = async (n) => {
  await b.evaluate(
    `document.querySelector('#case-detail-playrix [data-modal-scroll]').scrollTo({top:${n},behavior:'instant'})`,
  );
  await b.wait(120);
};
try {
  await fs.mkdir(".cache/case-gallery-check", { recursive: true });
  await b.call("Page.navigate", { url: base });
  await until(
    `document.readyState==='complete'&&!!document.querySelector('[data-case=playrix]')`,
  );
  await b.evaluate(
    `document.querySelector('[data-case=playrix]').scrollIntoView({behavior:'instant',block:'center'})`,
  );
  await until(
    `document.querySelector('#case-detail-playrix [data-case-cover]').loading==='eager'`,
  );
  await until(
    `document.querySelector('#case-detail-playrix [data-case-cover]').complete`,
  );
  assert.equal(
    await b.evaluate(`document.querySelector('#case-detail-playrix').open`),
    false,
    "Cover warms before opening",
  );
  const size = await b.evaluate(
    `(async()=>{let i=document.querySelector('#case-detail-playrix [data-case-cover]'),u=new URL(i.currentSrc);let old=new URL(u);old.searchParams.set('q','max');return{current:(await(await fetch(u)).blob()).size,old:(await(await fetch(old)).blob()).size,url:u.href}})()`,
  );
  assert.ok(size.current < size.old * 0.75, "Cover materially smaller");
  console.log("Cover bytes", size);
  for (let w of [360, 375, 768, 1024, 1440, 2500]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.evaluate(`document.querySelector('[data-case=playrix]').click()`);
    await until(`document.querySelector('#case-detail-playrix').open`);
    await b.wait(250);
    let a = await state();
    assert.equal(
      a.pinned,
      w >= 1024,
      "Desktop pin / mobile native gallery " + w,
    );
    assert.equal(a.vertical, 0);
    if (w >= 1024) {
      assert.ok(
        Math.abs(a.target + a.stageHeight - 900) < 2,
        "Text and photos keep their shared position when the row reaches the bottom",
      );
      await go(a.start - 150);
      const before = await state();
      assert.ok(before.x < 2, "No horizontal travel until photos enter fully");
      await go(a.start);
      let first = await state();
      assert.ok(Math.abs(first.x) < 2);
      assert.ok(Math.abs(first.top - a.target) < 2);
      await go(a.start + a.travel / 2);
      let mid = await state();
      assert.ok(
        Math.abs(mid.x - a.travel / 2) < 2,
        "Vertical drives horizontal " + w,
      );
      assert.ok(Math.abs(mid.top - a.target) < 2);
      assert.ok(
        Math.abs(mid.gap - first.gap) < 1 &&
          Math.abs(first.gap - before.gap) < 1,
        "Text-to-photo gap stays constant before and during horizontal travel",
      );
      assert.ok(
        first.photosBottom <= 900,
        "All of the photo row is visible before horizontal travel",
      );
      await go(a.start + a.travel);
      let end = await state();
      assert.ok(Math.abs(end.x - a.travel) < 2, "Last reachable " + w);
      await go(a.start);
      await b.evaluate(
        `document.querySelector('#case-detail-playrix .slider_list').focus()`,
      );
      await b.key("End");
      await b.wait(650);
      assert.ok(
        Math.abs((await state()).x - a.travel) < 2,
        "Keyboard updates parent " + w,
      );
      if (w === 1440) {
        await go(a.start);
        await b.call("Input.dispatchMouseEvent", {
          type: "mouseWheel",
          x: 700,
          y: 450,
          deltaX: 0,
          deltaY: 180,
        });
        await until(
          `document.querySelector('#case-detail-playrix [data-case-photo-scroll] .slider_list').scrollLeft>80`,
        );
        assert.ok(
          Math.abs((await state()).top - a.target) < 2,
          "Native wheel keeps the gallery pinned",
        );
      }
    } else {
      await go(a.stageHeight);
      assert.equal(
        (await state()).x,
        0,
        "Vertical scroll cannot move phone/tablet photos",
      );
      await b.evaluate(
        "document.querySelector('#case-detail-playrix .slider_list').focus()",
      );
      await b.key("End");
      await b.wait(300);
      assert.ok(
        Math.abs((await state()).x - a.travel) < 2,
        "Native mobile gallery reaches last photo",
      );
    }
    for (let index = 0; index < 4; index++) {
      const id = `case-photo-playrix-${index}`;
      await b.evaluate(
        `document.querySelector('[data-modal-open="${id}"]').click()`,
      );
      await until(`document.getElementById('${id}').open`);
      await b.wait(230);
      assert.equal(
        await b.evaluate(`document.querySelector('#case-detail-playrix').open`),
        true,
        "Parent stays open",
      );
      await until(
        `document.querySelector('#${id} img').complete&&document.querySelector('#${id} img').naturalWidth>0`,
      );
      const p = await b.evaluate(
        `(()=>{let m=document.getElementById('${id}'),i=m.querySelector('img'),r=i.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,focus:m.contains(document.activeElement)}})()`,
      );
      assert.ok(
        p.width > 0 &&
          p.height > 0 &&
          p.left >= 0 &&
          p.right <= w &&
          p.top >= 0 &&
          p.bottom <= 900 &&
          p.focus,
        "Lightbox fits " + w,
      );
      if (w === 1440 && index === 0) {
        const r = await b.call("Page.captureScreenshot", { format: "png" });
        await fs.writeFile(
          ".cache/case-gallery-check/lightbox.png",
          Buffer.from(r.data, "base64"),
        );
      }
      const before = await state();
      await b.key("Escape");
      await until(`!document.getElementById('${id}').open`);
      await b.wait(220);
      assert.equal(
        await b.evaluate(`document.querySelector('#case-detail-playrix').open`),
        true,
      );
      assert.equal(
        await b.evaluate("document.activeElement.dataset.modalOpen"),
        id,
      );
      assert.ok(
        Math.abs((await state()).y - before.y) < 2,
        "Parent position retained",
      );
    }
    await b.evaluate(
      `document.querySelector('#case-detail-playrix [data-modal-close]').click()`,
    );
    await until(`!document.querySelector('#case-detail-playrix').open`);
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 350,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate(`document.querySelector('[data-case=playrix]').click()`);
  await b.wait(250);
  assert.equal((await state()).pinned, false, "Short screen native row");
  await b.key("Escape");
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await b.evaluate(`document.querySelector('[data-case=playrix]').click()`);
  await b.wait(100);
  assert.equal((await state()).pinned, false, "Reduced motion native row");
  console.log(
    "Case gallery passed: cover prewarm, desktop pinned progress, mobile/tablet native swipe, keyboard, all 4 photo overlays, parent retention/focus/position, responsive image bounds, short-screen and reduced-motion fallback.",
  );
} finally {
  await b.close();
}
