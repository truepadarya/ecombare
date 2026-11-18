import { spawn } from "node:child_process";
import path from "node:path";
import { findBrowser } from "./browser-path.mjs";
export async function openBrowser() {
  const dir = path.resolve(`.cache/interaction-check/profile-${process.pid}`);
  const child = spawn(
    findBrowser(),
    [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-networking",
      "--remote-debugging-port=0",
      "--user-data-dir=" + dir,
      "about:blank",
    ],
    { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
  );
  let socket;
  try {
    const url = await new Promise((resolve, reject) => {
      let output = "";
      child.stderr.on("data", (b) => {
        output += b;
        const m = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (m) resolve(m[1]);
      });
      child.on("error", reject);
      setTimeout(() => reject(Error("Chrome timeout")), 15000).unref();
    });
    socket = new WebSocket(url);
    await new Promise((r) =>
      socket.addEventListener("open", r, { once: true }),
    );
    let id = 0;
    const pending = new Map();
    socket.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error
          ? p.reject(Error(JSON.stringify(m.error)))
          : p.resolve(m.result);
      }
    });
    const send = (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        const n = ++id;
        pending.set(n, { resolve, reject });
        socket.send(
          JSON.stringify({
            id: n,
            method,
            params,
            ...(sessionId ? { sessionId } : {}),
          }),
        );
      });
    const { targetId } = await send("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    const call = (m, p) => send(m, p, sessionId);
    await call("Page.enable");
    const evaluate = async (expression) => {
      const r = await call("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails)
        throw Error(
          r.exceptionDetails.exception?.description || r.exceptionDetails.text,
        );
      return r.result.value;
    };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const key = async (key, code = key, modifiers = 0) => {
      const vk =
        {
          Tab: 9,
          Enter: 13,
          Escape: 27,
          " ": 32,
          Home: 36,
          End: 35,
          ArrowLeft: 37,
          ArrowUp: 38,
          ArrowRight: 39,
          ArrowDown: 40,
        }[key] || 0;
      await call("Input.dispatchKeyEvent", {
        type: "keyDown",
        key,
        code,
        text: key === "Enter" ? "\r" : undefined,
        modifiers,
        windowsVirtualKeyCode: vk,
        nativeVirtualKeyCode: vk,
      });
      await call("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        modifiers,
        windowsVirtualKeyCode: vk,
        nativeVirtualKeyCode: vk,
      });
      await wait(40);
    };
    return {
      call,
      evaluate,
      key,
      wait,
      close: async () => {
        try {
          await send("Browser.close");
        } finally {
          socket.close();
          child.kill();
        }
      },
    };
  } catch (e) {
    socket?.close();
    child.kill();
    throw e;
  }
}
