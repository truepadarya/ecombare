import assert from "node:assert/strict";
import { openBrowser } from "./lib/browser-check.mjs";
const b = await openBrowser();
const base = (process.env.CHECK_URL || "http://localhost:4321").replace(
  /\/$/,
  "",
);
try {
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.call("Page.navigate", {
    url: `${base}/interaction-review`,
  });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    ready = await b.evaluate(
      "document.readyState==='complete'&&!!document.getElementById('video-viewport')",
    );
    if (ready) break;
    await b.wait(100);
  }
  assert.ok(ready);
  const enter = async (id) => {
    await b.evaluate(
      `document.getElementById('${id}').scrollIntoView({block:'center'})`,
    );
    for (let i = 0; i < 80; i++) {
      if (
        await b.evaluate(
          `!document.getElementById('${id}').paused && document.getElementById('${id}').readyState>=2`,
        )
      )
        return;
      await b.wait(100);
    }
    throw Error("Video did not start: " + id);
  };
  const leave = async () => {
    await b.evaluate(
      "document.getElementById('fields-brand').scrollIntoView()",
    );
    await b.wait(300);
  };
  await enter("video-viewport");
  await b.evaluate("document.getElementById('video-viewport').currentTime=4");
  await b.wait(250);
  await leave();
  assert.equal(
    await b.evaluate("document.getElementById('video-viewport').paused"),
    true,
  );
  await enter("video-viewport");
  assert.ok(
    await b.evaluate(
      "document.getElementById('video-viewport').currentTime>=4",
    ),
  );
  await enter("video-viewport-restart");
  await b.evaluate(
    "document.getElementById('video-viewport-restart').currentTime=4",
  );
  await b.wait(200);
  await leave();
  await enter("video-viewport-restart");
  assert.ok(
    await b.evaluate(
      "document.getElementById('video-viewport-restart').currentTime<2",
    ),
  );
  await b.evaluate("document.getElementById('video-viewport-restart').pause()");
  await b.wait(80);
  await leave();
  await b.evaluate(
    "document.getElementById('video-viewport-restart').scrollIntoView({block:'center'})",
  );
  await b.wait(300);
  assert.equal(
    await b.evaluate(
      "document.getElementById('video-viewport-restart').paused",
    ),
    true,
  );
  assert.equal(
    await b.evaluate("document.getElementById('video-manual').paused"),
    true,
  );
  assert.equal(
    await b.evaluate("document.getElementById('video-continuous').paused"),
    false,
  );
  await enter("video-once");
  const duration = await b.evaluate(
    "document.getElementById('video-once').duration",
  );
  assert.ok(Number.isFinite(duration));
  await b.evaluate(
    "document.getElementById('video-once').currentTime=document.getElementById('video-once').duration-.15",
  );
  await b.wait(600);
  assert.equal(
    await b.evaluate("document.getElementById('video-once').ended"),
    true,
  );
  await leave();
  await b.evaluate(
    "document.getElementById('video-once').scrollIntoView({block:'center'})",
  );
  await b.wait(300);
  assert.equal(
    await b.evaluate("document.getElementById('video-once').ended"),
    true,
  );
  console.log(
    "Real MP4 playback verified: viewport pause/resume, restart on re-entry, explicit pause, manual mode, continuous loop and play-once end state.",
  );
} finally {
  await b.close();
}
