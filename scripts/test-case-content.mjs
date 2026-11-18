import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser(),
  base = process.env.CHECK_URL || "http://localhost:4321";
const until = async (code) => {
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate(code)) return;
    await b.wait(50);
  }
  assert.fail(code);
};
const cases = [
  ["brainrocket", "brainrocket", "May 2025", ["200+", "5", "1"], 6],
  ["dashin", "dashin", "November 2024", ["100", "50"], 0],
  ["community", "grow-love", "February 2025", ["300+", "100%"], 0],
];
try {
  assert.equal(
    (
      await sharp(
        "src/assets/graphics/cases/community-tree-planting-trimmed.webp",
      ).stats()
    ).isOpaque,
    true,
    "No transparent strip reaches the Community mask",
  );
  await fs.mkdir(".cache/case-content-check", { recursive: true });
  await b.call("Page.navigate", { url: base });
  await until(
    `document.readyState==='complete'&&document.querySelectorAll('[data-case-detail]').length===4`,
  );
  await b.evaluate("document.fonts.ready");
  for (const width of [375, 768, 1440, 2500]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const [plaque, id, date, values, items] of cases) {
      const m = `document.getElementById('case-detail-${id}')`;
      await b.evaluate(
        `document.querySelector('[data-case="${plaque}"]').click()`,
      );
      await until(`${m}.open`);
      await b.wait(240);
      assert.equal(
        await b.evaluate(`${m}.querySelector('[data-modal-scroll]').scrollTop`),
        0,
        "Opening starts at the cover after a previous gallery position",
      );
      assert.equal(
        await b.evaluate(`${m}.querySelector('time').textContent.trim()`),
        date,
      );
      assert.deepEqual(
        await b.evaluate(
          `[...${m}.querySelectorAll('[aria-label="Project results"] > *')].map(e=>e.firstElementChild.textContent.trim())`,
        ),
        values,
      );
      assert.equal(
        await b.evaluate(`${m}.querySelectorAll('.u-rich-text li').length`),
        items,
      );
      assert.equal(
        await b.evaluate(`${m}.getAttribute('aria-labelledby')`),
        `case-detail-${id}-heading`,
      );
      await until(
        `[...${m}.querySelectorAll('article > section:first-child img')].every(e=>e.complete&&e.naturalWidth>0)`,
      );
      assert.equal(
        await b.evaluate(
          `(()=>{const s=${m}.querySelector('[data-modal-scroll]');return s.scrollWidth>s.clientWidth+1})()`,
        ),
        false,
        "No overflow " + id + " " + width,
      );
      if (width === 1440) {
        const shot = await b.call("Page.captureScreenshot", { format: "png" });
        await fs.writeFile(
          `.cache/case-content-check/${id}-cover.png`,
          Buffer.from(shot.data, "base64"),
        );
      }
      await b.evaluate(
        `${m}.querySelector('[data-modal-scroll]').scrollTo({top:900,behavior:'instant'})`,
      );
      await b.wait(150);
      await until(`${m}.querySelector('.case-detail-badge img').complete`);
      if (width === 1440) {
        const shot = await b.call("Page.captureScreenshot", { format: "png" });
        await fs.writeFile(
          `.cache/case-content-check/${id}-body.png`,
          Buffer.from(shot.data, "base64"),
        );
      }
      const geom = await b.evaluate(
        `(()=>{const m=${m},s=m.querySelector('[data-modal-scroll]'),r=m.querySelector('[data-case-photo-scroll]'),t=r.firstElementChild,l=r.querySelector('.slider_list');return {start:r.getBoundingClientRect().top-s.getBoundingClientRect().top+s.scrollTop-parseFloat(getComputedStyle(t).top),travel:l.scrollWidth-l.clientWidth}})()`,
      );
      if (width >= 1024) {
        await b.evaluate(
          `${m}.querySelector('[data-modal-scroll]').scrollTo({top:${geom.start + geom.travel / 2},behavior:'instant'})`,
        );
        await b.wait(120);
        assert.ok(
          await b.evaluate(
            `Math.abs(${m}.querySelector('.slider_list').scrollLeft-${geom.travel / 2})<2`,
          ),
          "Shared vertical-to-horizontal scroll works for " + id,
        );
      } else {
        assert.equal(
          await b.evaluate(
            `${m}.querySelector('[data-case-photo-scroll]').hasAttribute('data-pinned')`,
          ),
          false,
          "Mobile case gallery uses native swipe",
        );
        await b.evaluate(
          `${m}.querySelector('.slider_wrap').scrollIntoView({block:'end',behavior:'instant'})`,
        );
      }
      for (let i = 0; i < 4; i++) {
        await b.evaluate(
          `(()=>{const l=${m}.querySelector('.slider_list');l.scrollTo({left:l.children[${i}].offsetLeft,behavior:'instant'})})()`,
        );
        await b.wait(80);
      }
      await until(
        `[...${m}.querySelectorAll('img')].every(e=>e.complete&&e.naturalWidth>0)`,
      );
      assert.equal(await b.evaluate(`${m}.querySelectorAll('img').length`), 7);
      assert.equal(
        await b.evaluate(
          `[...${m}.querySelectorAll('img')].some(e=>e.currentSrc.includes('figma.com'))`,
        ),
        false,
      );
      const photoId = `case-photo-${id}-1`;
      await b.evaluate(
        `document.querySelector('[data-modal-open="${photoId}"]').click()`,
      );
      await until(`document.getElementById('${photoId}').open`);
      await b.wait(200);
      await b.key("Escape");
      await until(`!document.getElementById('${photoId}').open`);
      await b.wait(180);
      assert.equal(
        await b.evaluate(`${m}.open`),
        true,
        "Photo closes without closing " + id,
      );
      await b.key("Escape");
      await until(`!${m}.open`);
      await b.wait(160);
      assert.equal(
        await b.evaluate("document.activeElement.dataset.case"),
        plaque,
      );
    }
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 700,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate(`document.documentElement.style.fontSize='200%'`);
  for (const [plaque, id] of cases) {
    await b.evaluate(
      `document.querySelector('[data-case="${plaque}"]').click()`,
    );
    await b.wait(220);
    assert.equal(
      await b.evaluate(
        `(()=>{const s=document.querySelector('#case-detail-${id} [data-modal-scroll]');return s.scrollWidth>s.clientWidth+1})()`,
      ),
      false,
      "Large text " + id,
    );
    await b.key("Escape");
    await b.wait(150);
  }
  console.log(
    "Case content passed: three distinct Figma cases at four widths, dates/results/list copy, all local assets, shared sticky traversal, all photo layers and parent focus, 200% text, and an opaque corrected Community photograph.",
  );
} finally {
  await b.close();
}
