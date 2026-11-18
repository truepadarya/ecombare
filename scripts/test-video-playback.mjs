import assert from "node:assert/strict";
import { initializeVideoPlayback } from "../src/utils/video-playback.ts";

class Player extends EventTarget {
  constructor(mode, muted = true) {
    super();
    this.dataset = { videoPlayback: mode };
    this.muted = muted;
    this.controls = false;
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.plays = 0;
  }
  play() {
    this.plays++;
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    queueMicrotask(() => this.dispatchEvent(new Event("pause")));
  }
}
const resume = new Player("viewport");
const restart = new Player("viewport-restart");
const continuous = new Player("continuous");
const manual = new Player("manual", false);
const otherSound = new Player("manual", false);
const offsetRestart = new Player("viewport-restart");
offsetRestart.dataset.videoStartAt = "0.35";
offsetRestart.duration = 20;
const offsetManual = new Player("manual", false);
const minimal = new Player("viewport");
minimal.dataset.videoControls = "minimal";
offsetManual.dataset.videoStartAt = "0.2";
offsetManual.duration = 30;
const players = [
  resume,
  restart,
  continuous,
  manual,
  otherSound,
  offsetRestart,
  offsetManual,
  minimal,
];
const document = Object.assign(new EventTarget(), {
  hidden: false,
  querySelectorAll: () => players,
});
const reduced = Object.assign(new EventTarget(), { matches: false });
const observers = new Map();
globalThis.document = document;
globalThis.matchMedia = () => reduced;
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(video) {
    observers.set(video, this);
  }
  disconnect() {
    this.disconnected = true;
  }
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const enter = (video, ratio) =>
  observers
    .get(video)
    .callback([
      { target: video, isIntersecting: ratio > 0, intersectionRatio: ratio },
    ]);
const dispose = initializeVideoPlayback();
await flush();
assert.equal(resume.plays, 0);
assert.equal(manual.plays, 0);
assert.equal(continuous.paused, false);
enter(resume, 0.1);
assert.equal(resume.plays, 0);
enter(resume, 0.5);
await flush();
resume.currentTime = 5;
enter(resume, 0);
await flush();
assert.equal(resume.paused, true);
enter(resume, 0.5);
await flush();
assert.equal(resume.currentTime, 5);
resume.pause();
await flush();
const plays = resume.plays;
enter(resume, 0);
enter(resume, 0.5);
await flush();
assert.equal(
  resume.plays,
  plays,
  "Explicit user pause must survive viewport re-entry",
);
enter(restart, 0.5);
await flush();
restart.currentTime = 7;
enter(restart, 0);
await flush();
enter(restart, 0.5);
await flush();
assert.equal(restart.currentTime, 0);
enter(offsetRestart, 0.5);
await flush();
assert.equal(
  offsetRestart.currentTime,
  7,
  "Configured start position applies on first entry",
);
offsetRestart.currentTime = 12;
enter(offsetRestart, 0);
await flush();
enter(offsetRestart, 0.5);
await flush();
assert.equal(
  offsetRestart.currentTime,
  7,
  "Re-entry returns to the configured start position",
);
offsetManual.dispatchEvent(new Event("loadedmetadata"));
assert.equal(
  offsetManual.currentTime,
  6,
  "Initial position also applies to manual playback",
);
assert.equal(
  offsetManual.plays,
  0,
  "Setting initial position must not autoplay sound",
);
await otherSound.play();
await manual.play();
await flush();
assert.equal(otherSound.paused, true, "Only one unmuted video plays");
document.hidden = true;
document.dispatchEvent(new Event("visibilitychange"));
await flush();
assert.ok(players.every((p) => p.paused));
document.hidden = false;
document.dispatchEvent(new Event("visibilitychange"));
await flush();
assert.equal(continuous.paused, false);
assert.equal(manual.paused, true, "Sound must not resume automatically");
restart.muted = false;
restart.dispatchEvent(new Event("volumechange"));
enter(restart, 0);
await flush();
const soundPlays = restart.plays;
enter(restart, 0.5);
await flush();
assert.equal(
  restart.plays,
  soundPlays,
  "Unmuting must disable future automatic starts",
);
restart.muted = true;
reduced.matches = true;
reduced.dispatchEvent(new Event("change"));
await flush();
assert.ok(players.every((p) => p.paused));
assert.ok(players.filter((p) => p !== minimal).every((p) => p.controls));
assert.equal(
  minimal.controls,
  false,
  "Minimal player must never expose a scrubber",
);
await minimal.play();
await flush();
assert.equal(
  minimal.paused,
  false,
  "Minimal player allows explicit reduced-motion playback",
);
minimal.pause();
await flush();
enter(restart, 0);
enter(restart, 0.5);
await flush();
assert.equal(restart.paused, true);
await restart.play();
restart.dispatchEvent(new Event("loadedmetadata"));
await flush();
assert.equal(
  restart.paused,
  false,
  "Reduced motion must allow explicit playback",
);
dispose();
await flush();
assert.ok(players.every((p) => p.paused));
assert.ok([...observers.values()].every((o) => o.disconnected));
console.log(
  "Video playback passed: viewport threshold, resume/restart, user pause, background tab, sound exclusivity, reduced motion, explicit playback and cleanup.",
);
