import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const until = async (code) => {
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate(code)) return;
    await b.wait(50);
  }
  assert.fail("Timed out: " + code);
};
const metrics = async (w, h = 900, scale = 1) => {
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate(`document.documentElement.style.fontSize='${100 * scale}%'`);
  await b.wait(100);
};
const geometry = () =>
  b.evaluate(
    `(()=>{const h=document.querySelector('[data-site-nav]'),bar=h.querySelector('.nav_bar'),l=h.querySelector('.nav_logo'),n=h.querySelector('.nav_desktop'),a=h.querySelector('.nav_actions'),t=h.querySelector('.nav_toggle');const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};return {compact:h.hasAttribute('data-compact'),bar:rect(bar),logo:rect(l),links:rect(n),actions:rect(a),toggle:rect(t),overflow:document.documentElement.scrollWidth>innerWidth,header:rect(h),assets:[...l.querySelectorAll('img')].map(e=>({loaded:e.complete&&e.naturalWidth>0,...rect(e)}))}})()`,
  );
try {
  await fs.mkdir(".cache/nav-check", { recursive: true });
  await b.call("Page.navigate", { url: base });
  await until(
    `!!document.querySelector('[data-site-nav][data-ready]')&&document.readyState==='complete'`,
  );
  await b.evaluate("document.fonts.ready");
  await b.call("DOM.enable");
  await b.call("CSS.enable");
  for (const width of [375, 1440]) {
    await metrics(width);
    await b.evaluate(
      `(()=>{const h=document.querySelector('[data-site-nav]'),q=document.querySelector('#quote');window.scrollTo({top:q.getBoundingClientRect().top+scrollY-h.offsetHeight-4,behavior:'instant'})})()`,
    );
    await b.wait(250);
    assert.equal(
      await b.evaluate(
        `document.querySelector('[data-site-nav]').classList.contains('theme-dark')`,
      ),
      true,
      "Dark before the light section meets the header",
    );
    await b.evaluate(`window.scrollBy({top:8,behavior:'instant'})`);
    await b.wait(250);
    assert.equal(
      await b.evaluate(
        `getComputedStyle(document.querySelector('[data-site-nav]')).backgroundColor`,
      ),
      "rgb(255, 255, 255)",
      "Header becomes white at boundary",
    );
    assert.equal(
      await b.evaluate(
        `getComputedStyle(document.querySelector('.nav_link')).color`,
      ),
      "rgb(0, 0, 0)",
      "Links become black",
    );
    if (width === 1440) {
      const { root } = await b.call("DOM.getDocument");
      const { nodeId } = await b.call("DOM.querySelector", {
        nodeId: root.nodeId,
        selector: ".nav_desktop .nav_link",
      });
      await b.call("CSS.forcePseudoState", {
        nodeId,
        forcedPseudoClasses: ["hover"],
      });
      await b.wait(250);
      assert.deepEqual(
        await b.evaluate(
          "(()=>{const s=getComputedStyle(document.querySelector('.nav_desktop .nav_link'));return [s.color,s.textDecorationColor,s.textDecorationLine]})()",
        ),
        ["rgb(0, 0, 0)", "rgb(0, 0, 0)", "underline"],
        "Hover remains readable with black text and underline on white",
      );
      await b.call("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    }
    assert.equal(
      await b.evaluate(
        `getComputedStyle(document.querySelector('.nav_symbol')).filter`,
      ),
      "invert(1)",
      "Logo becomes black",
    );
    assert.equal(
      await b.evaluate(
        `document.querySelector('#site-menu').classList.contains('theme-light')`,
      ),
      true,
      "Mobile panel follows the header theme",
    );
    const shot = await b.call("Page.captureScreenshot", { format: "png" });
    await fs.writeFile(
      `.cache/nav-check/light-${width}.png`,
      Buffer.from(shot.data, "base64"),
    );
    await b.evaluate(`window.scrollTo({top:0,behavior:'instant'})`);
    await b.wait(250);
    assert.equal(
      await b.evaluate(
        `getComputedStyle(document.querySelector('[data-site-nav]')).backgroundColor`,
      ),
      "rgb(0, 0, 0)",
      "Returning to hero restores dark theme",
    );
  }
  for (const w of [
    360, 375, 479, 480, 767, 768, 1023, 1024, 1100, 1200, 1280, 1440, 1920,
    2500,
  ]) {
    await metrics(w);
    const g = await geometry();
    assert.equal(g.overflow, false, "Page overflow " + w);
    assert.ok(
      g.logo.left >= g.bar.left - 1 && g.logo.right < g.bar.right,
      "Logo fits " + w,
    );
    assert.ok(
      g.assets.every((a) => a.loaded && a.width > 0 && a.height > 0),
      "Local logo assets " + w,
    );
    if (g.compact) {
      assert.ok(g.toggle.left > g.logo.right + 8, "Mobile spacing " + w);
    } else {
      assert.ok(
        Math.abs(
          (g.links.left + g.links.right) / 2 - (g.bar.left + g.bar.right) / 2,
        ) < 1,
        "True centered links " + w,
      );
      assert.ok(
        g.links.left - g.logo.right > 20 && g.actions.left - g.links.right > 20,
        "No overlap " + w,
      );
      assert.ok(g.actions.right <= g.bar.right + 1);
    }
    if ([375, 1440].includes(w)) {
      await b.evaluate(
        "document.querySelector('astro-dev-toolbar')?.remove();document.querySelector('astro-dev-toolbar')?.remove()",
      );
      const shot = await b.call("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(
        `.cache/nav-check/header-${w}.png`,
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  await metrics(1440);
  await b.evaluate(
    `document.querySelector('.nav_actions a:last-child').focus()`,
  );
  await metrics(1100);
  assert.equal(
    await b.evaluate(
      `document.activeElement.matches('[data-modal-open="site-menu"]')`,
    ),
    true,
    "Shrinking a focused action transfers focus to Menu",
  );
  await metrics(1440, 900, 2);
  assert.equal(
    (await geometry()).compact,
    true,
    "Enlarged text collapses early",
  );
  await metrics(375, 700);
  await metrics(360, 800, 2);
  const enlarged = await geometry();
  assert.ok(
    enlarged.logo.right + 8 < enlarged.toggle.left,
    "Narrow screen with 200% text keeps the complete logo clear of Menu",
  );
  assert.equal(enlarged.overflow, false);
  await metrics(375, 700);
  const open = async () => {
    await b.evaluate(
      `document.querySelector('[data-modal-open="site-menu"]').focus()`,
    );
    await b.key("Enter");
    await until(`document.querySelector('#site-menu').open`);
    await b.wait(250);
  };
  await open();
  assert.equal(
    await b.evaluate(
      `document.querySelector('[data-modal-open="site-menu"]').getAttribute('aria-expanded')`,
    ),
    "true",
  );
  assert.equal(
    await b.evaluate(`getComputedStyle(document.documentElement).overflowY`),
    "hidden",
  );
  for (let i = 0; i < 14; i++) {
    await b.key("Tab");
    assert.equal(
      await b.evaluate(
        `document.querySelector('#site-menu').contains(document.activeElement)||document.activeElement===document.body`,
      ),
      true,
      "No background page element receives focus (native dialog permits browser chrome)",
    );
  }
  const shot = await b.call("Page.captureScreenshot", { format: "png" });
  await fs.writeFile(
    ".cache/nav-check/menu-mobile.png",
    Buffer.from(shot.data, "base64"),
  );
  await b.key("Escape");
  await until(`!document.querySelector('#site-menu').open`);
  assert.equal(
    await b.evaluate(
      `document.activeElement.matches('[data-modal-open="site-menu"]')`,
    ),
    true,
    "Escape restores trigger",
  );
  assert.equal(
    await b.evaluate(`document.activeElement.getAttribute('aria-expanded')`),
    "false",
  );
  assert.notEqual(
    await b.evaluate(`getComputedStyle(document.documentElement).overflowY`),
    "hidden",
  );
  await open();
  await metrics(1440);
  await until(`!document.querySelector('#site-menu').open`);
  assert.equal(
    await b.evaluate(`document.activeElement.matches('.nav_logo')`),
    true,
    "Desktop resize closes dialog and focuses visible logo",
  );
  await metrics(375);
  await open();
  await b.evaluate(
    `document.querySelector('#site-menu a[href="#programs"]').click()`,
  );
  await until(`!document.querySelector('#site-menu').open`);
  await b.wait(1300);
  assert.equal(await b.evaluate("location.hash"), "#programs");
  assert.equal(
    await b.evaluate("document.activeElement.id"),
    "programs",
    "Section receives keyboard focus",
  );
  assert.ok(
    await b.evaluate(
      `document.querySelector('#programs').getBoundingClientRect().top>=document.querySelector('.nav_wrap').offsetHeight-2`,
    ),
    "Anchor clears fixed header",
  );
  await metrics(375, 360);
  await open();
  assert.equal(
    await b.evaluate(
      `(()=>{const s=document.querySelector('#site-menu [data-modal-scroll]');return s.scrollHeight>s.clientHeight})()`,
    ),
    true,
    "Short landscape menu scrolls",
  );
  await b.evaluate(
    `document.querySelector('#site-menu [data-modal-scroll]').scrollTop=1000`,
  );
  assert.ok(
    await b.evaluate(
      `document.querySelector('#site-menu [data-modal-scroll]').scrollTop>0`,
    ),
  );
  await b.key("Escape");
  await b.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await open();
  assert.ok(
    await b.evaluate(
      `parseFloat(getComputedStyle(document.querySelector('#site-menu .modal_content')).transitionDuration)<.001`,
    ),
    "Reduced motion",
  );
  await b.key("Escape");
  assert.equal(
    await b.evaluate(`document.querySelector('.nav_actions a').href`),
    "mailto:ecombare@gmail.com?subject=Supporting%20ECOmbare",
  );
  const targets = await b.evaluate(
    `Array.from(document.querySelectorAll('.nav_desktop a,.nav_actions a')).filter(a=>a.hash).every(a=>document.getElementById(a.hash.slice(1)))`,
  );
  assert.ok(targets, "Every home anchor exists");
  await b.call("Page.navigate", { url: base + "/style-guide" });
  await until(
    `document.readyState==='complete'&&!!document.querySelector('[data-site-nav][data-ready]')`,
  );
  assert.ok(
    await b.evaluate(
      `Array.from(document.querySelectorAll('.nav_desktop a')).every(a=>new URL(a.href).pathname==='/'&&a.hash)`,
    ),
    "Review page links return to homepage sections",
  );
  console.log(
    "Navigation passed: 14 widths, centered desktop links, collision-free compact mode, local logo assets, 200% text, dialog focus trap/Escape/resize, anchor navigation and focus, scroll lock/release, short screens, reduced motion, email and all section links.",
  );
} finally {
  await b.close();
}
