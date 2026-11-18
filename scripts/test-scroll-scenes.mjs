import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
try {
  await fs.mkdir(".cache/scroll-scenes", { recursive: true });
  for (const width of [1440, 1920]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.call("Page.navigate", {
      url: process.env.CHECK_URL || "http://localhost:4321",
    });
    for (let i = 0; i < 100; i++) {
      if (
        await b.evaluate(
          "document.readyState==='complete' && document.querySelector('[data-impact-scroll]')?.hasAttribute('data-sequence') && document.querySelector('[data-team-scroll]')?.hasAttribute('data-pinned')",
        )
      )
        break;
      await b.wait(50);
    }
    for (const scene of ["impact", "team"]) {
      for (const progress of [0.2, 0.65, 1]) {
        await b.evaluate(
          `(()=>{const root=document.querySelector('[data-${scene}-scroll]'),stage=root.querySelector('.${scene}-stage');scrollTo({top:root.getBoundingClientRect().top+scrollY+(root.offsetHeight-stage.offsetHeight)*${progress},behavior:'instant'});})()`,
        );
        await b.wait(100);
        const state = await b.evaluate(
          `(()=>{const root=document.querySelector('[data-${scene}-scroll]'),stage=root.querySelector('.${scene}-stage'),r=root.getBoundingClientRect(),s=stage.getBoundingClientRect(),middle=document.elementFromPoint(innerWidth/2,innerHeight/2);return {isolated:getComputedStyle(root).isolation,clip:getComputedStyle(root).overflow,background:getComputedStyle(stage).backgroundColor,stageTop:s.top,contained:s.bottom<=r.bottom+2,hit:root.contains(middle),overflow:document.documentElement.scrollWidth>innerWidth};})()`,
        );
        assert.equal(state.isolated, "isolate");
        assert.equal(state.clip, "clip");
        assert.equal(state.background, "rgb(255, 255, 255)");
        assert.ok(
          Math.abs(state.stageTop) < 2,
          `${scene} stays pinned at ${progress}`,
        );
        assert.ok(state.contained, "Stage stays within its section");
        assert.ok(state.hit, "Adjacent section cannot paint above the scene");
        assert.equal(state.overflow, false);
        if (progress === 0.65) {
          const shot = await b.call("Page.captureScreenshot", {
            format: "png",
          });
          await fs.writeFile(
            `.cache/scroll-scenes/${scene}-${width}.png`,
            Buffer.from(shot.data, "base64"),
          );
        }
      }
      await b.evaluate(
        `(()=>{const r=document.querySelector('[data-${scene}-scroll]');scrollTo({top:r.getBoundingClientRect().bottom+scrollY+50,behavior:'instant'});})()`,
      );
      await b.wait(100);
      assert.ok(
        await b.evaluate(
          `document.querySelector('[data-${scene}-scroll] .${scene}-stage').getBoundingClientRect().bottom<=0`,
        ),
        "Stage releases and cannot spill into following content",
      );
    }
    console.log(
      `Scroll scenes passed at ${width}px: opaque isolated surfaces, pinning, bounds, stacking and release.`,
    );
  }
} finally {
  await b.close();
}
