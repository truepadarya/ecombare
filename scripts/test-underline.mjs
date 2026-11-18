import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { openBrowser } from "./lib/browser-check.mjs";

const browser = await openBrowser();
const url =
  (process.env.CHECK_URL || "http://localhost:4321") + "/typography-review";
const ready = async () => {
  for (let i = 0; i < 100; i++) {
    if (
      await browser.evaluate(
        "document.querySelectorAll('[data-underline][data-ready]').length===2",
      )
    )
      return;
    await browser.wait(50);
  }
  throw Error("Underline did not initialize");
};
try {
  await browser.call("Page.navigate", { url });
  await ready();
  assert.equal(
    await browser.evaluate(
      "document.querySelector('[data-animate=true]').hasAttribute('data-pending')",
    ),
    true,
    "Wait for viewport entry",
  );
  await browser.evaluate(
    "window.scrollBy(0, document.querySelector('[data-animate=true]').getBoundingClientRect().top - (innerHeight - 30))",
  );
  await browser.wait(100);
  assert.equal(
    await browser.evaluate(
      "document.querySelector('[data-animate=true]').hasAttribute('data-pending')",
    ),
    true,
    "Keep the stroke hidden while the phrase is at the bottom edge",
  );
  await browser.evaluate(
    "document.querySelector('[data-animate=true]').scrollIntoView({block:'center'})",
  );
  await browser.wait(40);
  assert.ok(
    await browser.evaluate(
      "document.querySelector('[data-animate=true]').getAnimations({subtree:true}).length>0",
    ),
    "Draw the source SVG stroke on entry",
  );
  const motion =
    await browser.evaluate(`document.querySelector('[data-animate=true]').getAnimations({subtree:true}).map(a=>({
    ...a.effect.getTiming(),width:a.effect.target.getBoundingClientRect().width
  }))`);
  assert.ok(
    Math.abs(motion.reduce((sum, a) => sum + a.duration, 0) - 750) < 1,
    "One continuous 750ms gesture",
  );
  assert.equal(Math.min(...motion.map(a => a.delay)), 200, "Pause before drawing");
  const totalWidth = motion.reduce((sum, a) => sum + a.width, 0);
  for (const animation of motion) {
    assert.equal(
      animation.easing,
      "linear",
      "No stop/start easing between lines",
    );
    assert.ok(
      Math.abs(animation.duration / animation.width - 750 / totalWidth) < 0.01,
      "Constant drawing speed across wrapped lines",
    );
  }
  await browser.wait(1050);
  await fs.mkdir(".cache/underline-check", { recursive: true });
  for (const [width, scale] of [
    [360, 1],
    [375, 1],
    [768, 1],
    [992, 1],
    [1440, 1],
    [1920, 1],
    [2500, 1],
    [360, 1.25],
    [360, 2],
    [768, 2],
  ]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await browser.evaluate(
      `document.documentElement.style.fontSize='${scale * 100}%'`,
    );
    await browser.wait(150);
    await browser.evaluate(
      "document.getElementById('underline').scrollIntoView()",
    );
    await browser.wait(750);
    const result = await browser.evaluate(`(() => {
      const roots=[...document.querySelectorAll('[data-underline]')];
      return {overflow:document.documentElement.scrollWidth>innerWidth, roots:roots.map(root=>{
        const range=document.createRange();range.selectNodeContents(root.querySelector('.underline_text'));
        const rects=[...range.getClientRects()].filter(r=>r.width&&r.height);
        const svgs=[...root.querySelectorAll('svg')];
        return {text:root.querySelector('.underline_text').textContent, lines:rects.length, svgs:svgs.map((svg,i)=>{
          const r=svg.getBoundingClientRect(),t=rects[i],p=svg.querySelector('path');
          return {left:r.left,width:r.width,textLeft:t.left,textWidth:t.width,top:r.top,bottom:r.bottom,textBottom:t.bottom,
            color:getComputedStyle(svg).color,dash:getComputedStyle(p).strokeDasharray,clip:getComputedStyle(svg).clipPath,stroke:getComputedStyle(p).strokeWidth,
            hidden:svg.getAttribute('aria-hidden'),focus:svg.getAttribute('focusable')};
        }),textLayer:getComputedStyle(root.querySelector('.underline_text')).zIndex,lineLayer:getComputedStyle(root.querySelector('.underline_lines')).zIndex,pending:root.hasAttribute('data-pending'),animations:root.getAnimations({subtree:true}).length};
      })};
    })()`);
    assert.equal(result.overflow, false, `Overflow at ${width}/${scale}`);
    for (const root of result.roots) {
      assert.equal(
        root.lines,
        root.svgs.length,
        `One stroke per wrapped line at ${width}/${scale}`,
      );
      assert.equal(root.pending, false);
      assert.equal(root.animations, 0);
      assert.ok(
        Number(root.textLayer) > Number(root.lineLayer),
        "Text paints above the decorative stroke",
      );
      for (const svg of root.svgs) {
        assert.ok(
          Math.abs(svg.left - svg.textLeft) < 1,
          "Stroke starts at its text fragment",
        );
        assert.ok(
          Math.abs(svg.width - svg.textWidth) < 1,
          "Stroke fits its text fragment",
        );
        assert.ok(
          svg.top < svg.textBottom && svg.bottom > svg.textBottom - 20,
          "Stroke follows text baseline",
        );
        assert.equal(
          svg.dash,
          "none",
          "Full continuous stroke, without a truncated dash",
        );
        assert.equal(svg.clip, "none", "Completed stroke is not clipped");
        assert.equal(svg.hidden, "true");
        assert.equal(svg.focus, "false");
      }
    }
    if (scale === 1 && [360, 1440].includes(width)) {
      const { data } = await browser.call("Page.captureScreenshot", {
        format: "png",
      });
      await fs.writeFile(
        `.cache/underline-check/underline-${width}.png`,
        Buffer.from(data, "base64"),
      );
      // Inspect actual ink, not just the SVG box (the previous dash bug passed
      // geometry checks while leaving the last letters without an underline).
      if (width === 1440) {
        const { data: pixels, info } = await sharp(Buffer.from(data, "base64"))
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        for (const root of result.roots)
          for (const svg of root.svgs) {
            let lastInk = -1;
            for (
              let y = Math.max(0, Math.floor(svg.top));
              y < Math.min(info.height, Math.ceil(svg.bottom));
              y++
            ) {
              for (
                let x = Math.max(0, Math.floor(svg.left));
                x < Math.min(info.width, Math.ceil(svg.left + svg.width));
                x++
              ) {
                const index = (y * info.width + x) * info.channels;
                if (
                  pixels[index] >= 195 &&
                  pixels[index] <= 220 &&
                  pixels[index + 1] > 245 &&
                  pixels[index + 2] >= 85 &&
                  pixels[index + 2] <= 120
                )
                  lastInk = Math.max(lastInk, x);
              }
            }
            assert.ok(
              svg.left + svg.width - lastInk < 4,
              "Visible lime ink reaches the end of the text",
            );
          }
      }
    }
  }
  // Re-entry must not restart the animation.
  await browser.evaluate("scrollTo(0,0)");
  await browser.wait(100);
  await browser.evaluate(
    "document.getElementById('underline').scrollIntoView()",
  );
  assert.equal(
    await browser.evaluate(
      "document.querySelector('[data-underline]').getAnimations({subtree:true}).length",
    ),
    0,
  );
  await browser.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await browser.call("Page.navigate", { url });
  await ready();
  assert.equal(
    await browser.evaluate(
      "[...document.querySelectorAll('[data-underline]')].every(e=>!e.hasAttribute('data-pending')&&e.getAnimations({subtree:true}).length===0)",
    ),
    true,
  );
  await browser.call("Emulation.setScriptExecutionDisabled", { value: true });
  await browser.call("Emulation.setEmulatedMedia", { features: [] });
  await browser.call("Page.navigate", { url });
  await browser.wait(500);
  assert.equal(
    await browser.evaluate(
      "document.querySelectorAll('[data-underline]').length===2 && [...document.querySelectorAll('[data-underline]')].every(e=>!e.hasAttribute('data-ready') && getComputedStyle(e).textDecorationLine==='underline')",
    ),
    true,
    "No-JS static underline",
  );
  console.log(
    "Underline passed: natural wrapping at 360–2500, 125%/200% text, exact fragment alignment, decorative SVG semantics, one-time drawing, reduced motion and no-JS fallback.",
  );
} finally {
  await browser.close();
}
