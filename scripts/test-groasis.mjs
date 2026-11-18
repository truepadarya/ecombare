import assert from "node:assert/strict";
import { openBrowser } from "./lib/browser-check.mjs";

const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
try {
  await b.call("Page.navigate", { url: base });
  for (let i = 0; i < 80; i++) {
    if (
      await b.evaluate(
        "document.readyState==='complete' && !!document.getElementById('technology')",
      )
    )
      break;
    await b.wait(80);
  }
  await b.evaluate("document.fonts.ready");
  assert.equal(
    await b.evaluate(
      "!!document.querySelector('[data-team-scroll]').previousElementSibling.querySelector('#technology')",
    ),
    true,
    "Directly before Team",
  );
  assert.equal(
    await b.evaluate("document.querySelectorAll('#groasis-heading').length"),
    1,
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#technology').getAttribute('aria-labelledby')",
    ),
    "groasis-heading",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#technology .groasis-partnership').getAttribute('aria-label')",
    ),
    "ECOmbare, official partner of Groasis",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('.eco-footer a[href=\"#technology\"]').textContent.trim()",
    ),
    "Technology",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelectorAll('#technology button,#technology input').length",
    ),
    0,
    "Decorative badges are not fake controls",
  );
  for (const width of [360, 375, 768, 1024, 1440, 1920, 2500]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.wait(120);
    await b.evaluate(
      "(()=>{const s=document.getElementById('technology');window.scrollTo({top:scrollY+s.getBoundingClientRect().top,behavior:'instant'})})()",
    );
    await b.wait(120);
    const loaded = await b.evaluate(
      "Promise.all([...document.querySelectorAll('#technology img')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.decode().then(()=>true,()=>false)))",
    );
    loaded.forEach((v) =>
      assert.equal(v, true, "All visible artwork loads at " + width),
    );
    const geometry = await b.evaluate(
      `(()=>{const s=document.getElementById('technology'),p=s.querySelector('.text'),h=s.querySelector('h2'),left=s.querySelector('.groasis-left-art'),right=s.querySelector('.groasis-right-art');const r=h.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,headingInside:r.left>=0&&r.right<=document.documentElement.clientWidth,rightVisible:getComputedStyle(right).display!=='none',treesBelow:left.getBoundingClientRect().top>=p.getBoundingClientRect().bottom,alt:[...s.querySelectorAll('img')].every(e=>e.alt===''),height:s.getBoundingClientRect().height,contentBottom:Math.max(p.getBoundingClientRect().bottom,h.getBoundingClientRect().bottom)-s.getBoundingClientRect().top};})()`,
    );
    assert.equal(geometry.overflow, false, "No page overflow at " + width);
    assert.equal(
      geometry.headingInside,
      true,
      "Heading stays inside at " + width,
    );
    assert.equal(geometry.alt, true, "Artwork is decorative");
    assert.equal(
      geometry.rightVisible,
      width >= 1024,
      "Responsive tree composition",
    );
    if (width < 1024)
      assert.equal(geometry.treesBelow, true, "Mobile trees follow text");
    assert.ok(
      geometry.contentBottom < geometry.height,
      "All text remains in the section",
    );
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate("document.documentElement.style.fontSize='200%'");
  await b.wait(120);
  assert.equal(
    await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
    "200% text has no horizontal overflow",
  );
  assert.equal(
    await b.evaluate(
      "(()=>{const s=document.getElementById('technology');return s.querySelector('.groasis-left-art').getBoundingClientRect().top>=s.querySelector('.text').getBoundingClientRect().bottom})()",
    ),
    true,
    "200% text cannot overlap trees",
  );
  await b.evaluate("document.documentElement.style.fontSize=''");
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 400,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.wait(100);
  assert.ok(
    await b.evaluate(
      "document.getElementById('technology').getBoundingClientRect().height>innerHeight",
    ),
    "Short screens allow natural section height",
  );
  console.log(
    "Groasis passed: direct placement before Team, accessible heading and partnership, exact local artwork loaded at 360-2500, responsive tree placement, no overflow, 200% text, short screens and working Technology navigation.",
  );
} finally {
  await b.close();
}
