import assert from "node:assert/strict";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = (process.env.CHECK_URL || "http://localhost:4321").replace(
  /\/$/,
  "",
);
const markup =
  '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6><p>Readable text with <strong>strong emphasis</strong>, <em>emphasis</em> and <a href="#rich-text">a link</a>.</p><ul><li>First item</li><li>Nested items<ul><li>Nested item</li></ul></li></ul><ol><li>Ordered item</li></ol><blockquote><p>A quoted paragraph.</p></blockquote><p>Closing paragraph.</p>';
const widths = [360, 992, 1440, 1920, 2500];
const metrics = [
  "fontSize",
  "fontFamily",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textTransform",
];
const read = () =>
  b.evaluate(
    '(()=>{const root=document.getElementById("utility-rich-text-test");const css=e=>{const s=getComputedStyle(e);return Object.fromEntries(' +
      JSON.stringify(metrics) +
      '.map(k=>[k,s[k]]))};const headings=[...root.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e=>({actual:css(e),reference:css(document.querySelector("[data-scale-sample].text-style-"+e.tagName.toLowerCase()))}));return {headings,p:css(root.querySelector("p")),body:css(document.querySelector("[data-scale-sample].text-style-main")),disc:getComputedStyle(root.querySelector("ul")).listStyleType,circle:getComputedStyle(root.querySelector("ul ul")).listStyleType,decimal:getComputedStyle(root.querySelector("ol")).listStyleType,padding:parseFloat(getComputedStyle(root.querySelector("ul")).paddingLeft),quote:parseFloat(getComputedStyle(root.querySelector("blockquote")).borderLeftWidth),first:parseFloat(getComputedStyle(root.firstElementChild).marginTop),last:parseFloat(getComputedStyle(root.lastElementChild).marginBottom),strong:getComputedStyle(root.querySelector("strong")).fontWeight,link:getComputedStyle(root.querySelector("a")).textDecorationLine,overflow:root.scrollWidth>root.clientWidth+1};})()',
  );
try {
  await b.call("Page.navigate", { url: base + "/typography-review" });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    ready = await b.evaluate(
      'document.readyState==="complete"&&document.querySelectorAll("[data-scale-sample]").length===9',
    );
    if (ready) break;
    await b.wait(100);
  }
  assert(ready);
  await b.evaluate("document.fonts.ready");
  await b.evaluate(
    '(()=>{const root=document.createElement("div");root.id="utility-rich-text-test";root.className="u-rich-text text-style-main";root.innerHTML=' +
      JSON.stringify(markup) +
      ';document.querySelector("main .container").append(root);})()',
  );
  for (const width of widths) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.evaluate(
      "new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))",
    );
    const result = await read();
    assert.equal(result.disc, "disc", "u-rich-text unordered list");
    assert.equal(result.circle, "circle", "u-rich-text nested list");
    assert.equal(result.decimal, "decimal", "u-rich-text ordered list");
    assert(result.padding > 0, "List indentation");
    assert(result.quote > 0, "Blockquote border");
    assert.equal(result.first, 0, "First-child margin");
    assert.equal(result.last, 0, "Last-child margin");
    assert.equal(result.overflow, false, "Rich text overflow at " + width);
    assert.equal(result.link, "underline", "Rich text link");
    for (const heading of result.headings)
      assert.deepEqual(
        heading.actual,
        heading.reference,
        "Heading metrics at " + width,
      );
    assert.deepEqual(result.p, result.body, "Paragraph main at " + width);
    assert.equal(
      result.headings[5].actual.fontSize,
      result.p.fontSize,
      "H6 follows main",
    );
    for (const variant of ["large", "small"]) {
      const pair = await b.evaluate(
        '(()=>{const root=document.getElementById("utility-rich-text-test");root.className="u-rich-text text-style-' +
          variant +
          '";const actual=getComputedStyle(root.querySelector("p")),reference=getComputedStyle(document.querySelector("[data-scale-sample].text-style-' +
          variant +
          '"));return ' +
          JSON.stringify(metrics) +
          ".map(k=>[actual[k],reference[k]]);})()",
      );
      for (const [actual, reference] of pair)
        assert.equal(
          actual,
          reference,
          "Paragraph " + variant + " at " + width,
        );
    }
    await b.evaluate(
      'document.getElementById("utility-rich-text-test").className="u-rich-text text-style-main"',
    );
  }
  await b.call("Page.navigate", {
    url: base + "/example-components#rich-text",
  });
  let componentReady = false;
  for (let i = 0; i < 100; i++) {
    componentReady = await b.evaluate(
      'document.readyState==="complete"&&!!document.querySelector(".rich-text")',
    );
    if (componentReady) break;
    await b.wait(100);
  }
  assert(componentReady);
  const component = await b.evaluate(
    '(()=>{const r=document.querySelector(".rich-text");return {alias:r.classList.contains("u-rich-text"),maxWidth:getComputedStyle(r).maxWidth,list:getComputedStyle(r.querySelector("ul")).listStyleType,headings:r.querySelectorAll("h1,h2,h3,h4,h5,h6").length,overflow:r.scrollWidth>r.clientWidth+1};})()',
  );
  assert(component.alias, "RichText shares the utility class");
  assert.equal(component.list, "disc");
  assert.equal(
    component.headings,
    6,
    "All heading levels in the component review",
  );
  assert.notEqual(component.maxWidth, "none");
  assert.equal(component.overflow, false);
  console.log(
    "Rich text passed: global u-rich-text without component CSS, shared component class, all heading metrics, H6/main sizing, paragraph variants, list markers, nested lists, links, blockquotes, trimmed margins and no overflow at five anchors.",
  );
} finally {
  await b.close();
}
