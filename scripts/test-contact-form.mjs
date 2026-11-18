import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { openBrowser } from "./lib/browser-check.mjs";

const b = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
const size = (width, height = 1000) =>
  b.call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
const ready = async () => {
  for (let i = 0; i < 100; i++) {
    if (
      await b.evaluate(
        "document.readyState==='complete' && !!document.querySelector('#contact-form button:not(:disabled)')",
      )
    )
      break;
    await b.wait(50);
  }
  await b.evaluate("document.fonts.ready");
};
try {
  await size(1440);
  await b.call("Page.navigate", { url: base });
  await ready();
  assert.equal(
    await b.evaluate("document.getElementById('contact-message').value"),
    "",
    "Initial textarea must be empty, not template whitespace",
  );
  assert.equal(
    await b.evaluate(
      "[...document.querySelectorAll('#contact-form input,#contact-form textarea')].every(e=>getComputedStyle(e,'::placeholder').fontWeight==='400')",
    ),
    true,
    "Placeholders use regular weight",
  );
  await b.evaluate(
    `window.contactRequests=[];window.originalContactFetch=window.fetch;window.fetch=(...args)=>{if(args[1]?.headers?.Accept==='application/json'){window.contactRequests.push(args);return Promise.reject(new Error('No delivery in this test'));}return window.originalContactFetch(...args);}`,
  );
  for (const width of [360, 390, 768, 1024, 1440, 2500]) {
    await size(width);
    await b.wait(80);
    const geometry = await b.evaluate(`(()=>{
      const f=document.querySelector('#contact-form'),r=f.getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth,width:r.width,fields:[...f.querySelectorAll('input,textarea')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:parseFloat(s.borderRadius),name:e.labels?.[0]?.textContent.trim(),max:e.maxLength};})};
    })()`);
    assert.equal(geometry.overflow, false, "No overflow at " + width);
    if (width === 1440) {
      assert.equal(geometry.width, 688);
      geometry.fields.slice(0, 3).forEach((f) => {
        assert.equal(f.height, 64);
        assert.equal(f.radius, 16);
      });
    }
    geometry.fields.forEach((f) => {
      assert.ok(f.width <= geometry.width);
      assert.ok(f.name);
      assert.ok(f.max > 0);
    });
  }
  await size(1440);
  const validation = await b.evaluate(`(()=>{
    const f=document.querySelector('#contact-form'),n=f.elements.namedItem('name'),e=f.elements.namedItem('email');
    const set=(field,value)=>{field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));};
    const valid=v=>{set(n,v);return n.checkValidity();};
    const result={empty:f.checkValidity(),blank:valid('   '),international:["Jean-Luc D'Avila",'\u5f20 \u4f1f','\u041e\u043b\u044c\u0433\u0430'].map(valid)};
    set(n,'Test');set(e,'wrong@');result.badEmail=e.checkValidity();set(e,'test@example.com');result.good=f.checkValidity();return result;
  })()`);
  assert.equal(validation.empty, false);
  assert.equal(validation.blank, false);
  validation.international.forEach((v) => assert.equal(v, true));
  assert.equal(validation.badEmail, false);
  assert.equal(validation.good, true);
  await b.evaluate(`(()=>{
    const f=document.querySelector('#contact-form'),e=f.elements.namedItem('email');
    e.value='y@we';e.dispatchEvent(new Event('input',{bubbles:true}));f.requestSubmit();
  })()`);
  assert.equal(
    await b.evaluate("document.activeElement.id"),
    "contact-email",
    "First invalid field receives focus",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-email').getAttribute('aria-invalid')",
    ),
    "true",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-email-error').textContent",
    ),
    "Enter a complete email address, for example name@example.com.",
  );
  assert.equal(
    await b.evaluate("window.contactRequests.length"),
    0,
    "Invalid input never sends a request",
  );
  await b.evaluate(
    "document.querySelector('#contact-email').value='test@example.com';document.querySelector('#contact-email').dispatchEvent(new Event('input',{bubbles:true}))",
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-email').hasAttribute('aria-invalid')",
    ),
    false,
    "Correcting input clears error",
  );
  await b.evaluate("document.getElementById('contact-name').focus()");
  for (const id of ["contact-email", "contact-company", "contact-message"]) {
    await b.key("Tab");
    assert.equal(await b.evaluate("document.activeElement.id"), id);
  }
  await b.key("Tab");
  assert.equal(
    await b.evaluate(
      "document.activeElement.matches('#contact-form button') && document.activeElement.type==='submit'",
    ),
    true,
  );
  await b.evaluate(
    "document.getElementById('contact-name').value='';document.getElementById('contact-name').focus()",
  );
  await b.call("Input.insertText", { text: "x".repeat(110) });
  assert.equal(
    await b.evaluate("document.getElementById('contact-name').value.length"),
    100,
  );
  const payload = '<img src=x onerror="window.contactInjection=true">';
  await b.evaluate(
    `document.getElementById('contact-message').value=${JSON.stringify(payload)};document.querySelector('#contact-form').requestSubmit()`,
  );
  await b.wait(100);
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-form').parentElement.dataset.state",
    ),
    "failed",
  );
  assert.equal(await b.evaluate("window.contactRequests.length"), 0);
  assert.equal(
    await b.evaluate("document.getElementById('contact-message').value"),
    payload,
  );
  assert.equal(await b.evaluate("window.contactInjection===true"), false);
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-form').parentElement.querySelector('.form_note-failed').textContent.includes('has not been sent')",
    ),
    true,
  );
  assert.equal(
    await b.evaluate("document.querySelector('#contact-form button').disabled"),
    false,
  );
  assert.equal(
    await b.evaluate(
      "document.querySelector('#contact-form').hasAttribute('aria-busy')",
    ),
    false,
  );
  await b.evaluate(
    "document.querySelector('#contact-form').reset();document.querySelector('#contact-form').parentElement.dataset.state='idle'",
  );
  await b.evaluate(
    "document.activeElement.blur();document.querySelector('astro-dev-toolbar')?.remove();window.scrollTo({top:0,behavior:'instant'})",
  );
  for (const width of [360, 768, 1440]) {
    await size(width, 900);
    await b.evaluate(
      "document.getElementById('contact').scrollIntoView({block:'end',behavior:'instant'})",
    );
    await b.wait(250);
    const crop = await b.evaluate(
      "(()=>{const r=document.getElementById('contact').getBoundingClientRect(),top=Math.max(0,Math.floor(r.top));return {left:0,top,width:innerWidth,height:Math.min(innerHeight-top,Math.ceil(r.bottom)-top)};})()",
    );
    const shot = await b.call("Page.captureScreenshot", {
      format: "png",
    });
    await fs.mkdir(".cache/contact-form", { recursive: true });
    await fs.writeFile(
      `.cache/contact-form/${width}.png`,
      await sharp(Buffer.from(shot.data, "base64")).extract(crop).toBuffer(),
    );
  }
  await size(360);
  await b.evaluate("document.documentElement.style.fontSize='200%'");
  await b.wait(100);
  assert.equal(
    await b.evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
    "200% text must not overflow",
  );
  await b.call("Emulation.setScriptExecutionDisabled", { value: true });
  await b.call("Page.navigate", { url: base });
  await b.wait(500);
  await b.call("Emulation.setScriptExecutionDisabled", { value: false });
  assert.equal(
    await b.evaluate("document.querySelector('#contact-form button').disabled"),
    true,
    "No JS: native POST is prevented",
  );
  console.log(
    "Contact form passed: 360-2500 layouts, 200% text, accessible labels, keyboard order, international names, blank/email validation, typed length limit, no network delivery, no HTML execution, retained input, recoverable error and no-JS guard.",
  );
} finally {
  await b.close();
}
