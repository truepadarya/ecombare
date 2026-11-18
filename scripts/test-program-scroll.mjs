import assert from "node:assert/strict";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
try {
  for (const width of [360, 390, 768, 1023]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 780,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.call("Page.navigate", {
      url: process.env.CHECK_URL || "http://localhost:4321",
    });
    for (let i = 0; i < 100; i++) {
      if (
        await b.evaluate(
          "document.readyState==='complete' && !!document.querySelector('.program-item .program-visual')",
        )
      )
        break;
      await b.wait(50);
    }
    for (const index of [5, 2, 4, 0, 3, 1, 5, 5]) {
      await b.evaluate(
        `document.querySelectorAll('.program-summary')[${index}].scrollIntoView({block:'start',behavior:'instant'})`,
      );
      await b.wait(100);
      const before = await b.evaluate(
        `(()=>{const s=document.querySelectorAll('.program-summary')[${index}],r=s.getBoundingClientRect();return {x:r.left+80,y:r.top+r.height/2,top:r.top,open:s.parentElement.open}})()`,
      );
      await b.call("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: before.x,
        y: before.y,
        button: "left",
        clickCount: 1,
      });
      await b.call("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: before.x,
        y: before.y,
        button: "left",
        clickCount: 1,
      });
      await b.wait(100);
      const state = await b.evaluate(
        `(()=>{const s=document.querySelectorAll('.program-summary')[${index}];return {top:s.getBoundingClientRect().top,open:s.parentElement.open,selected:[...document.querySelectorAll('.program-item')].findIndex(e=>e.open),moving:[...document.querySelectorAll('.program-item')].flatMap(e=>e.getAnimations()).length}})()`,
      );
      assert.equal(
        state.open,
        !before.open,
        "Native exclusive toggle remains usable",
      );
      assert.equal(
        state.selected,
        before.open ? -1 : index,
        "Correct panel remains open",
      );
      assert.ok(
        Math.abs(state.top - before.top) < 2,
        `Clicked heading stays in place at ${width}, item ${index}: ${before.top} -> ${state.top}`,
      );
      assert.equal(state.moving, 0, "No mobile FLIP offsets");
      await b.wait(250);
      assert.ok(
        Math.abs(
          (await b.evaluate(
            `document.querySelectorAll('.program-summary')[${index}].getBoundingClientRect().top`,
          )) - state.top,
        ) < 2,
        "No delayed browser or Lenis jump",
      );
    }
    if (width < 768) {
      const quote = await b.evaluate(
        "(()=>{const q=document.querySelector('#quote'),p=q.querySelector('p');return {font:parseFloat(getComputedStyle(p).fontSize),top:parseFloat(getComputedStyle(q).paddingTop),bottom:parseFloat(getComputedStyle(q).paddingBottom)}})()",
      );
      assert.ok(quote.font >= 32, "Larger mobile quote");
      assert.ok(quote.bottom < quote.top * 0.6, "Smaller quote bottom gap");
    }
    console.log(
      `Programs passed at ${width}px: all panels, repeated switch/close, stable heading and delayed scroll position.`,
    );
  }
} finally {
  await b.close();
}
