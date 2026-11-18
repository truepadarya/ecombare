import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const until = async (code) => {
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate(code)) return;
    await b.wait(50);
  }
  assert.fail(code);
};
const go = async (selector) => {
  await b.evaluate(
    `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`,
  );
  await b.wait(150);
};
const swipe = async (selector) => {
  await b.evaluate(
    `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`,
  );
  await b.wait(100);
  const point = await b.evaluate(
    `(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:innerWidth*.8,y:Math.max(100,Math.min(innerHeight-80,r.top+r.height/2))}})()`,
  );
  await b.call("Emulation.setTouchEmulationEnabled", { enabled: true });
  await b.call("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  for (let i = 1; i <= 8; i++) {
    await b.call("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: point.x - i * 20, y: point.y }],
    });
    await b.wait(20);
  }
  await b.call("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await b.wait(150);
  assert.ok(
    await b.evaluate(
      `document.querySelector(${JSON.stringify(selector)}).scrollLeft>20`,
    ),
    `Real touch swipe: ${selector}`,
  );
  await b.call("Emulation.setTouchEmulationEnabled", { enabled: false });
};
try {
  await fs.mkdir(".cache/mobile-refinement", { recursive: true });
  for (const width of [360, 390, 430, 768, 1440]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.call("Page.navigate", { url: base });
    await until(
      "document.readyState==='complete'&&document.querySelector('[data-site-nav][data-ready]')&&document.querySelector('#contact-form button:not(:disabled)')",
    );
    await b.evaluate("document.fonts.ready");
    await b.wait(1100);
    assert.equal(
      await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
      false,
      "No page overflow " + width,
    );
    if (width < 768) {
      const state = await b.evaluate(
        `(()=>{const rect=e=>e.getBoundingClientRect();return {buttons:[...document.querySelectorAll('#main .button_wrap.mobile-full')].map(e=>({width:rect(e).width,parent:rect(e.parentElement).width,height:rect(e).height})),menu:rect(document.querySelector('.nav_toggle .button_wrap')).width,h1:parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),intro:parseFloat(getComputedStyle(document.querySelector('#quote p')).fontSize),item:parseFloat(getComputedStyle(document.querySelector('.program-summary')).fontSize),align:getComputedStyle(document.querySelector('#quote blockquote')).textAlign,gradient:getComputedStyle(document.querySelector('.case-gallery-edge-top')).backgroundImage,pinnedTeam:document.querySelector('[data-team-scroll]').hasAttribute('data-pinned'),pinImpact:document.querySelector('[data-impact-scroll]').hasAttribute('data-sequence')};})()`,
      );
      assert.ok(
        state.buttons.every(
          (e) => e.height >= 56 && Math.abs(e.width - e.parent) < 2,
        ),
        JSON.stringify(state.buttons),
      );
      assert.ok(state.menu < width / 2, "Navigation stays compact");
      assert.ok(state.h1 >= 72);
      assert.ok(state.intro >= state.item, "Intro hierarchy");
      assert.equal(state.align, "start");
      assert.ok(state.gradient.includes("linear-gradient"));
      assert.equal(state.pinnedTeam, false);
      assert.equal(state.pinImpact, true, "Mobile impact sequence");
      await go(".program-summary");
      await b.evaluate("document.querySelector('.program-item').open=true");
      await b.wait(100);
      const visual = await b.evaluate(
        "(()=>{const v=document.querySelector('.program-item[open] .program-visual'),p=v.closest('.program-item');return {w:v.offsetWidth,parent:p.offsetWidth,margin:getComputedStyle(v).marginLeft}})()",
      );
      assert.ok(Math.abs(visual.w - visual.parent) < 2);
      assert.equal(visual.margin, "0px");
    }
    for (const selector of [
      "#hero",
      "#quote",
      ".program-item[open]",
      "#team-heading",
      "#contact",
    ]) {
      await go(selector);
      const shot = await b.call("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(
        `.cache/mobile-refinement/${width}-${selector.replace(/[^a-z]/gi, "")}.png`,
        Buffer.from(shot.data, "base64"),
      );
    }
    if (width < 768) {
      const impact = await b.evaluate(
        "(()=>{const r=document.querySelector('[data-impact-scroll]');return r.getBoundingClientRect().top+scrollY})()",
      );
      await b.evaluate(`scrollTo({top:${impact}+200,behavior:'instant'})`);
      await b.wait(80);
      const a = await b.evaluate(
        "[...document.querySelectorAll('.impact-stat')].map(e=>Number(getComputedStyle(e).opacity))",
      );
      assert.ok(a[0] > a.at(-1), "Numbers enter in order");
      await b.wait(300);
      assert.deepEqual(
        await b.evaluate(
          "[...document.querySelectorAll('.impact-stat')].map(e=>Number(getComputedStyle(e).opacity))",
        ),
        a,
        "Scroll freezes statistics",
      );
      await b.evaluate(
        `scrollTo({top:${impact}+innerHeight*1.95,behavior:'instant'})`,
      );
      await b.wait(100);
      assert.equal(
        await b.evaluate(
          "getComputedStyle(document.querySelector('.impact-viewport')).opacity",
        ),
        "0",
        "Numbers dissolve before mission",
      );
      assert.equal(
        await b.evaluate(
          "getComputedStyle(document.querySelector('.impact-mission')).opacity",
        ),
        "1",
        "Mission types after numbers",
      );
      const hiddenText = await b.evaluate(
        "[...CSS.highlights.get('impact-hidden')].map(r=>r.toString()).join('')",
      );
      assert.ok(hiddenText.length > 0, "Mission is partly typed");
      await b.wait(200);
      assert.equal(
        await b.evaluate(
          "[...CSS.highlights.get('impact-hidden')].map(r=>r.toString()).join('')",
        ),
        hiddenText,
        "Typing freezes without scroll",
      );
      const spacing = await b.evaluate(
        "(()=>{const c=document.querySelector('.team-cta'),b=c.querySelector('button'),r=document.querySelector('[data-team-viewport]'),next=document.querySelector('#contact-heading');return {before:b.getBoundingClientRect().top-r.getBoundingClientRect().bottom,after:next.getBoundingClientRect().top-b.getBoundingClientRect().bottom}})()",
      );
      assert.ok(
        spacing.before >= 0 &&
          spacing.before < 64 &&
          spacing.after > spacing.before,
        "CTA stays closer to its team than to the next heading",
      );
      await swipe("[data-team-viewport]");
      await b.evaluate("document.querySelector('[data-case=playrix]').click()");
      await b.wait(250);
      const gallery = await b.evaluate(
        "(()=>{const m=document.querySelector('#case-detail-playrix'),r=m.querySelector('[data-case-photo-scroll]'),p=r.querySelector('.case-photo');return {pinned:r.hasAttribute('data-pinned'),photoWidth:p.offsetWidth}})()",
      );
      assert.equal(
        gallery.pinned,
        false,
        "Popup gallery is native swipe on phones",
      );
      assert.ok(gallery.photoWidth < width * 0.8, "Smaller gallery photos");
      await swipe("#case-detail-playrix .slider_list");
      await b.evaluate(
        "document.querySelector('#case-detail-playrix [data-modal-close]').click()",
      );
    }
    console.log("Mobile refinement passed at " + width + "px");
  }
} finally {
  await b.close();
}
