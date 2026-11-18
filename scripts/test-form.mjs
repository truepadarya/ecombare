import assert from "node:assert/strict";
import { openBrowser } from "./lib/browser-check.mjs";

const browser = await openBrowser();
const base = process.env.CHECK_URL || "http://localhost:4321";
async function until(expression) {
  for (let i = 0; i < 100; i++) {
    if (await browser.evaluate(expression)) return;
    await browser.wait(30);
  }
  assert.fail("Timed out: " + expression);
}
async function prepare() {
  await browser.call("Page.navigate", { url: base + "/example-components" });
  await until(
    "document.readyState === 'complete' && !!document.querySelector('.form_fields')",
  );
  await browser.evaluate(`(() => {
    window.formRequests=[];
    window.fetch=(url,init)=>{
      window.formRequests.push({url:String(url),method:init.method,body:init.body ? [...init.body.entries()].map(([k,v])=>[k,typeof v==='string'?v:v.name]) : null});
      return new Promise((resolve,reject)=>{window.resolveFormRequest=resolve;window.rejectFormRequest=reject;init.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
    };
    const f=document.querySelector('.form_fields');f.id='submission-test';
    for(const e of f.querySelectorAll('[required]'))e.value=e.type==='email'?'test@example.com':'Test message';
    const button=f.querySelector('button');button.type='submit';button.name='intent';button.value='contact';
    const extra=document.createElement('button');extra.type='submit';extra.disabled=true;extra.id='already-disabled';f.append(extra);
    const external=document.createElement('button');external.type='submit';external.setAttribute('form',f.id);external.id='external-submit';document.body.append(external);
  })()`);
}
const submit = () =>
  browser.evaluate(
    "document.querySelector('.form_fields').requestSubmit(document.querySelector('.form_fields button[type=submit]'))",
  );
try {
  await prepare();
  await submit();
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_wrap').dataset.state",
    ),
    "failed",
    "Missing action must not report success",
  );
  assert.equal(await browser.evaluate("window.formRequests.length"), 0);
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields input[required]').value",
    ),
    "Test message",
    "Missing action preserves entered data",
  );

  await prepare();
  await browser.evaluate(
    "document.querySelector('.form_fields').action='/__form-test?source=review'",
  );
  await submit();
  const pending = await browser.evaluate(
    `(() => {const f=document.querySelector('.form_fields');return {state:f.parentElement.dataset.state,busy:f.getAttribute('aria-busy'),disabled:[...f.elements].filter(e=>e.type==='submit').every(e=>e.disabled),request:window.formRequests[0]};})()`,
  );
  assert.equal(pending.state, "sending");
  assert.equal(pending.busy, "true");
  assert.equal(
    pending.disabled,
    true,
    "All associated submit buttons are locked",
  );
  assert.equal(pending.request.method, "POST");
  assert.ok(
    pending.request.body.some(([k, v]) => k === "intent" && v === "contact"),
    "Submitter is included before disabling buttons",
  );
  await browser.evaluate(
    "document.querySelector('.form_fields').dispatchEvent(new SubmitEvent('submit',{cancelable:true,submitter:document.getElementById('external-submit')}))",
  );
  assert.equal(
    await browser.evaluate("window.formRequests.length"),
    1,
    "No duplicate delivery while pending",
  );
  await browser.evaluate("window.resolveFormRequest({ok:false,status:500})");
  await until("document.querySelector('.form_wrap').dataset.state==='failed'");
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields input[required]').value",
    ),
    "Test message",
    "HTTP failure preserves data",
  );
  assert.deepEqual(
    await browser.evaluate(
      "[document.querySelector('.form_fields button[type=submit]').disabled,document.getElementById('external-submit').disabled,document.getElementById('already-disabled').disabled]",
    ),
    [false, false, true],
  );
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields').hasAttribute('aria-busy')",
    ),
    false,
  );
  await submit();
  await browser.evaluate("window.resolveFormRequest({ok:true,status:200})");
  await until("document.querySelector('.form_wrap').dataset.state==='sent'");
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields input[required]').value",
    ),
    "",
    "Data resets only after HTTP success",
  );

  await prepare();
  await browser.evaluate(`(() => {
    const f=document.querySelector('.form_fields');f.action='/__form-test?source=review';f.method='get';
    const input=document.createElement('input');input.type='file';input.name='attachment';const transfer=new DataTransfer();transfer.items.add(new File(['test'],'note.txt'));input.files=transfer.files;f.append(input);
  })()`);
  await submit();
  const get = await browser.evaluate("window.formRequests[0]");
  assert.equal(get.method, "GET");
  assert.equal(get.body, null, "GET has no request body");
  const url = new URL(get.url);
  assert.equal(url.searchParams.get("source"), "review");
  assert.equal(url.searchParams.get("intent"), "contact");
  assert.equal(url.searchParams.get("attachment"), "note.txt");
  await browser.evaluate("window.rejectFormRequest(new TypeError('Offline'))");
  await until("document.querySelector('.form_wrap').dataset.state==='failed'");
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields input[required]').value",
    ),
    "Test message",
  );

  await prepare();
  await browser.evaluate(
    `(() => {const f=document.querySelector('.form_fields');f.action='/__form-post';const b=f.querySelector('button[type=submit]');b.setAttribute('formaction','/__form-override');b.setAttribute('formmethod','get');})()`,
  );
  await submit();
  const overridden = await browser.evaluate("window.formRequests[0]");
  assert.equal(overridden.method, "GET");
  assert.equal(new URL(overridden.url).pathname, "/__form-override");
  await browser.evaluate("window.resolveFormRequest({ok:true,status:204})");
  await until("document.querySelector('.form_wrap').dataset.state==='sent'");

  await prepare();
  await browser.evaluate(
    `(()=>{document.querySelector('.form_fields').action='/__timeout-test';const native=window.setTimeout;window.setTimeout=(callback,ms,...args)=>{if(ms===30000){window.triggerFormTimeout=callback;return native(()=>{},ms);}return native(callback,ms,...args);};})()`,
  );
  await submit();
  await browser.evaluate("window.triggerFormTimeout()");
  await until("document.querySelector('.form_wrap').dataset.state==='failed'");
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields input[required]').value",
    ),
    "Test message",
    "Timeout retains user data",
  );
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_fields button[type=submit]').disabled",
    ),
    false,
    "Timeout restores submit control",
  );

  await prepare();
  await browser.evaluate(
    "document.querySelector('.form_fields').action='/__form-test';document.querySelector('.form_fields input[required]').value=''",
  );
  await submit();
  assert.equal(
    await browser.evaluate("window.formRequests.length"),
    0,
    "Native invalid fields do not submit",
  );
  assert.equal(
    await browser.evaluate(
      "document.querySelector('.form_wrap').dataset.state",
    ),
    "idle",
  );
  await browser.evaluate(
    "document.querySelector('.form_fields button[type=submit]').formNoValidate=true",
  );
  await submit();
  assert.equal(
    await browser.evaluate("window.formRequests.length"),
    1,
    "Explicit formnovalidate is respected",
  );
  await browser.evaluate("window.resolveFormRequest({ok:true,status:200})");
  await until("document.querySelector('.form_wrap').dataset.state==='sent'");
  console.log(
    "Form passed: missing action, POST/GET, submitter overrides, duplicate prevention, HTTP/network failures, timeout, retry, disabled-state restoration, native validation and reset after confirmed success. Requests were mocked.",
  );
} finally {
  await browser.close();
}
