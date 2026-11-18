import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";

const browser = await openBrowser();
const { call, evaluate, wait, key } = browser;
const url = process.env.CHECK_URL || "http://localhost:4321";
const until = async (expression) => {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await wait(50);
  }
  assert.fail(`Timed out: ${expression}`);
};
const navigate = async (width) => {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evaluate(
    "if(document.documentElement) document.documentElement.dataset.previousDocument='true'",
  );
  await call("Page.navigate", { url });
  await until(
    "document.readyState === 'complete' && document.documentElement?.dataset.pageReveal === 'ready' && !document.documentElement.hasAttribute('data-previous-document')",
  );
};
const scrollTo = async (selector) => {
  await evaluate(
    `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`,
  );
  await wait(200);
};
try {
  await fs.mkdir(".cache/page-reveal", { recursive: true });
  for (const width of [360, 768, 1440, 2500]) {
    await navigate(width);
    assert.deepEqual(
      await evaluate(
        `['programs','impact','cases','partners','technology','team','contact'].map(id=>document.querySelector('#'+id)).map((element,_,all)=>all.indexOf(element)===0||!!(all[all.indexOf(element)-1].compareDocumentPosition(element)&Node.DOCUMENT_POSITION_FOLLOWING))`,
      ),
      Array(7).fill(true),
      "Section order",
    );
    await until(
      "[...document.querySelectorAll('#hero [data-reveal]')].every(e=>e.hasAttribute('data-revealed'))",
    );
    const heroTiming = await evaluate(
      `document.querySelector('#hero [data-reveal="3"]').getAnimations().map(a=>a.effect.getTiming())`,
    );
    if (heroTiming.length)
      assert.equal(heroTiming[0].delay, 360, "Hero CTA follows text");
    await wait(1000);
    // Stop halfway through the quote entrance: waiting must not advance it.
    await evaluate(
      `(()=>{const e=document.querySelector('#quote [data-reveal]');scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight*.81,behavior:'instant'})})()`,
    );
    await wait(100);
    const partial = await evaluate(
      "Number(getComputedStyle(document.querySelector('#quote [data-reveal]')).opacity)",
    );
    assert.ok(partial > 0 && partial < 1, "Intermediate scroll opacity");
    await wait(700);
    assert.ok(
      Math.abs(
        (await evaluate(
          "Number(getComputedStyle(document.querySelector('#quote [data-reveal]')).opacity)",
        )) - partial,
      ) < 0.005,
      "Stopped scroll freezes entrance",
    );
    const stroke = await evaluate(
      "Number(document.querySelector('#quote [data-progress]').dataset.progress)",
    );
    assert.ok(stroke > 0 && stroke < 1, "Quote stroke follows scroll");
    await evaluate("scrollBy({top:-100,behavior:'instant'})");
    await wait(100);
    assert.ok(
      (await evaluate(
        "Number(getComputedStyle(document.querySelector('#quote [data-reveal]')).opacity)",
      )) < partial,
      "Reverse scroll reverses entrance",
    );
    assert.equal(
      await evaluate("document.documentElement.scrollWidth > innerWidth"),
      false,
      "No overflow",
    );
    for (const selector of [
      "#quote",
      "#programs",
      "#partners-heading",
      "#groasis-heading",
      "#team-heading",
      "[data-team-viewport]",
      "#contact-heading",
      "#contact-form",
      ".eco-footer-brand",
    ]) {
      await scrollTo(selector);
      const visible = await evaluate(
        `(()=>{const node=document.querySelector(${JSON.stringify(selector)}); const target=node.matches('[data-reveal]')?node:node.querySelector('[data-reveal]');return target?.hasAttribute('data-revealed')&&getComputedStyle(target).opacity==='1'})()`,
      );
      assert.ok(visible, `Revealed ${selector} at ${width}`);
    }
    await scrollTo("#hero");
    assert.equal(
      await evaluate(
        "[...document.querySelectorAll('#hero [data-reveal]')].flatMap(e=>e.getAnimations()).length",
      ),
      0,
      "No replay on return",
    );
    await scrollTo("#technology");
    const shot = await call("Page.captureScreenshot", { format: "png" });
    await fs.writeFile(
      `.cache/page-reveal/technology-${width}.png`,
      Buffer.from(shot.data, "base64"),
    );
    console.log(
      `Page reveal passed at ${width}px: scroll progress freezes and reverses, quote stroke, section order, final visibility, no overflow or hero replay.`,
    );
  }

  await navigate(1440);
  await evaluate("document.querySelector('#contact-name').focus()");
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('#contact-form')).opacity",
    ),
    "1",
    "Keyboard focus reveals form immediately",
  );
  await key("Tab");
  assert.equal(await evaluate("document.activeElement.id"), "contact-email");
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await until("!document.documentElement.hasAttribute('data-page-reveal')");
  await until(
    "[...document.querySelectorAll('[data-reveal]')].every(e=>getComputedStyle(e).opacity==='1')",
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[data-reveal]')].every(e=>getComputedStyle(e).opacity==='1')",
    ),
    true,
    "Live reduced-motion change shows all content: " +
      JSON.stringify(
        await evaluate(
          "[...document.querySelectorAll('[data-reveal]')].filter(e=>getComputedStyle(e).opacity!=='1').map(e=>({id:e.id,cls:e.className,opacity:getComputedStyle(e).opacity,animations:e.getAnimations().map(a=>({state:a.playState,time:a.currentTime}))}))",
        ),
      ),
  );
  await call("Page.navigate", { url });
  await until("document.readyState==='complete'");
  assert.equal(
    await evaluate("document.documentElement.hasAttribute('data-page-reveal')"),
    false,
    "Reduced-motion skips setup",
  );
  await call("Emulation.setEmulatedMedia", { features: [] });
  await call("Emulation.setScriptExecutionDisabled", { value: true });
  await call("Page.navigate", { url });
  await wait(1500);
  await call("Emulation.setScriptExecutionDisabled", { value: false });
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[data-reveal]')].every(e=>getComputedStyle(e).opacity==='1')",
    ),
    true,
    "No-JavaScript content remains visible",
  );
  console.log(
    "Keyboard access, live/reloaded reduced motion and no-JavaScript fallback passed.",
  );
} finally {
  await browser.close();
}
