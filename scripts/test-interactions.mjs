import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { openBrowser } from "./lib/browser-check.mjs";
const browser = await openBrowser();
const { call, evaluate, key, wait } = browser;
try {
  await call("DOM.enable");
  await call("CSS.enable");
  for (const width of [375, 1440]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await call("Page.navigate", {
      url:
        (process.env.CHECK_URL || "http://localhost:4321") +
        "/interaction-review",
    });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      ready = await evaluate(
        "document.readyState==='complete' && !!document.querySelector('.slider_wrap.is-ready')",
      );
      if (ready) break;
      await wait(100);
    }
    assert.ok(ready, "Review did not load");
    await evaluate("document.fonts.ready");
    await evaluate(
      "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    );
    assert.equal(
      await evaluate("document.documentElement.scrollWidth>innerWidth"),
      false,
      "Overflow at " + width,
    );
    assert.equal(
      await evaluate(
        'new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size === document.querySelectorAll("[id]").length',
      ),
      true,
      "Duplicate IDs",
    );
    await evaluate(
      "document.querySelector('#review-slider .slider_list').focus()",
    );
    await key("End");
    assert.ok(
      await evaluate(
        "(()=>{const l=document.querySelector('#review-slider .slider_list');return l.scrollLeft>=l.scrollWidth-l.clientWidth-2})()",
      ),
      "End key",
    );
    await key("Home");
    assert.ok(
      await evaluate(
        "document.querySelector('#review-slider .slider_list').scrollLeft<2",
      ),
      "Home key",
    );
    await key("ArrowRight");
    assert.ok(
      await evaluate(
        "document.querySelector('#review-slider .slider_list').scrollLeft>10",
      ),
      "Arrow key",
    );
    const marker = await evaluate(
      "(()=>{const r=document.querySelector('.slider_marker').getBoundingClientRect();return {w:r.width,h:r.height}})()",
    );
    assert.ok(marker.w >= 44 && marker.h >= 44);
    if (width === 375) {
      await evaluate(
        "document.querySelector('#review-slider .slider_list').scrollTo({left:0,behavior:'instant'});document.querySelector('#review-slider .slider_list').scrollIntoView({block:'center'})",
      );
      await wait(120);
      const point = await evaluate(
        "(()=>{const r=document.querySelector('#review-slider .slider_list').getBoundingClientRect();return {x:r.left+r.width*.8,y:r.top+r.height*.5}})()",
      );
      await call("Emulation.setTouchEmulationEnabled", { enabled: true });
      await call("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      for (let i = 1; i <= 8; i++) {
        await call("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: point.x - i * 24, y: point.y }],
        });
        await wait(20);
      }
      await call("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await wait(600);
      assert.ok(
        await evaluate(
          "document.querySelector('#review-slider .slider_list').scrollLeft>10",
        ),
        "Native touch swipe",
      );
      await call("Emulation.setTouchEmulationEnabled", { enabled: false });
    }
    for (const [trigger, id] of [
      ["open-review-modal", "review-modal"],
      ["open-review-panel", "review-panel"],
      ["open-review-screen", "review-screen"],
    ]) {
      await evaluate(`document.getElementById('${trigger}').click()`);
      await wait(240);
      assert.equal(
        await evaluate(`document.getElementById('${id}').matches(':modal')`),
        true,
      );
      assert.equal(
        await evaluate(
          `document.getElementById('${id}').contains(document.activeElement)`,
        ),
        true,
      );
      for (let i = 0; i < 5; i++) await key("Tab");
      assert.equal(
        await evaluate(
          `document.getElementById('${id}').contains(document.activeElement)`,
        ),
        true,
        "Focus escaped dialog",
      );
      const scroll = await evaluate(
        `(()=>{const s=document.querySelector('#${id} .modal_scroll');s.scrollTop=s.scrollHeight;return {scroll:s.scrollTop,overflow:s.scrollHeight>s.clientHeight}})()`,
      );
      assert.equal(
        scroll.overflow,
        true,
        JSON.stringify({ width, id, scroll }),
      );
      assert.ok(scroll.scroll > 0);
      await key("Escape");
      await wait(240);
      assert.equal(
        await evaluate(`document.getElementById('${id}').open`),
        false,
      );
      assert.equal(
        await evaluate(`document.activeElement.id`),
        trigger,
        "Focus not restored",
      );
    }
    await evaluate("document.getElementById('open-review-modal').click()");
    await wait(240);
    await evaluate(
      "(()=>{const m=document.getElementById('review-modal');m.querySelector('.modal_body').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));m.dispatchEvent(new MouseEvent('click',{bubbles:true}))})()",
    );
    assert.equal(
      await evaluate("document.getElementById('review-modal').open"),
      true,
      "Content drag closed dialog",
    );
    await call("Emulation.setTouchEmulationEnabled", { enabled: true });
    await call("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 2, y: 100 }],
    });
    await call("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await wait(240);
    assert.equal(
      await evaluate("document.getElementById('review-modal').open"),
      false,
      "Touch backdrop did not close",
    );
    await call("Emulation.setTouchEmulationEnabled", { enabled: false });
    await evaluate("document.getElementById('open-review-modal').click()");
    await wait(240);
    await evaluate(
      "document.querySelector('#review-modal [data-modal-close]').click()",
    );
    await wait(240);
    assert.equal(
      await evaluate("document.activeElement.id"),
      "open-review-modal",
      "Close button did not restore focus",
    );
    for (const theme of ["light", "dark", "brand"]) {
      const root = `#fields-${theme}`;
      const geometry = await evaluate(`(() => {
        const root=document.querySelector('${root}');
        const read=e=>{const s=getComputedStyle(e);return {height:e.getBoundingClientRect().height,radius:parseFloat(s.borderRadius),border:parseFloat(s.borderTopWidth),padding:parseFloat(s.paddingLeft),outline:parseFloat(s.outlineWidth),outlineColor:s.outlineColor,borderColor:s.borderTopColor};};
        const input=root.querySelector('input[type=email]:not([aria-invalid]):not(:disabled)');
        const button=root.querySelector('button[type=reset]');
        input.focus();const focus=read(input);
        const errorProbe=document.createElement('span');errorProbe.style.color='var(--error)';root.append(errorProbe);const error=getComputedStyle(errorProbe).color;errorProbe.remove();
        const invalid=[...root.querySelectorAll('[aria-invalid=true]')].map(e=>read(e.matches('.form-choice_input')?e.nextElementSibling:e.matches('.form-range_input')?e.parentElement.querySelector('.form-range_handle'):e));
        return {input:read(input),button:read(button),focus,error,invalid,choice:read(root.querySelector('.form-choice')),rail:read(root.querySelector('.form-range_track')),handle:read(root.querySelector('.form-range_handle'))};
      })()`);
      assert.ok(
        Math.abs(
          geometry.input.radius -
            (8 + 8 * Math.max(0, Math.min(1, (width - 360) / 1080))),
        ) < 0.01,
        theme + " fluid field radius",
      );
      assert.equal(geometry.button.radius, 8, theme + " button radius");
      assert.equal(geometry.input.border, 1, theme + " field border");
      assert.equal(geometry.button.border, 1, theme + " button border");
      const expectedButton = width < 768 ? 56 + ((width - 360) * 8) / 1080 : 48;
      assert.ok(
        Math.abs(geometry.button.height - expectedButton) < 0.02,
        theme + " responsive button height",
      );
      if (width === 375)
        assert.ok(
          geometry.input.height >= 56 && geometry.input.height < 57,
          theme + " mobile field height",
        );
      if (width === 1440) {
        assert.equal(geometry.input.height, 64, theme + " Figma field height");
        assert.equal(
          geometry.input.padding,
          24,
          theme + " Figma field padding",
        );
        assert.equal(
          geometry.handle.height,
          28,
          theme + " shared range handle",
        );
      }
      assert.ok(
        geometry.input.height >= 44 && geometry.choice.height >= 44,
        theme + " touch targets",
      );
      assert.equal(geometry.rail.height, 4, theme + " shared range rail");
      assert.equal(geometry.focus.outline, 2, theme + " keyboard focus width");
      assert.equal(
        geometry.invalid.length,
        5,
        theme + " all invalid control kinds",
      );
      geometry.invalid.forEach((control) =>
        assert.equal(
          control.borderColor,
          geometry.error,
          theme + " error role",
        ),
      );
      const edgeStates = await evaluate(`(() => {
        const root=document.querySelector('${root}');
        const chip=root.querySelector('.form-choice.chip'), input=chip.querySelector('input');
        input.setAttribute('aria-invalid','true');
        const chipText=getComputedStyle(chip.querySelector('.form-choice_text')).color;
        const chipColor=getComputedStyle(chip).color;
        input.removeAttribute('aria-invalid');
        const invalid=root.querySelector('.field-control[aria-invalid=true]');invalid.focus();
        const s=getComputedStyle(invalid), focus={width:parseFloat(s.outlineWidth),color:s.outlineColor,border:s.borderTopColor};
        const disabled=root.querySelector('.field-control:disabled');disabled.setAttribute('aria-invalid','true');disabled.focus();
        const disabledFocus=document.activeElement===disabled, disabledBorder=getComputedStyle(disabled).borderTopColor;
        disabled.removeAttribute('aria-invalid');
        const select=root.querySelector('select:not([aria-invalid]):not(:disabled)');select.value='';
        const placeholder=getComputedStyle(select).color;
        const probe=document.createElement('span');probe.style.color='var(--field-placeholder)';root.append(probe);
        const expectedPlaceholder=getComputedStyle(probe).color;probe.remove();
        return {chipText,chipColor,focus,disabledFocus,disabledBorder,placeholder,expectedPlaceholder};
      })()`);
      assert.equal(
        edgeStates.chipText,
        edgeStates.chipColor,
        theme + " selected invalid chip retains readable text",
      );
      assert.equal(
        edgeStates.focus.width,
        2,
        theme + " invalid field focus width",
      );
      assert.equal(
        edgeStates.focus.color,
        geometry.error,
        theme + " invalid field focus color",
      );
      assert.equal(
        edgeStates.focus.border,
        geometry.error,
        theme + " invalid field border",
      );
      assert.equal(
        edgeStates.disabledFocus,
        false,
        theme + " disabled field cannot focus",
      );
      assert.equal(
        edgeStates.disabledBorder,
        "rgba(0, 0, 0, 0)",
        theme + " disabled field ignores invalid styling",
      );
      assert.equal(
        edgeStates.placeholder,
        edgeStates.expectedPlaceholder,
        theme + " select uses shared placeholder role",
      );
      await evaluate(
        `document.querySelector('${root} input[type=email]:not([aria-invalid]):not(:disabled)').focus()`,
      );
      const doc = await call("DOM.getDocument");
      const buttonNode = await call("DOM.querySelector", {
        nodeId: doc.root.nodeId,
        selector: root + " button[type=reset]",
      });
      await call("CSS.forcePseudoState", {
        nodeId: buttonNode.nodeId,
        forcedPseudoClasses: ["active"],
      });
      await evaluate(
        `(()=>{const button=document.querySelector('${root} button[type=reset]');void getComputedStyle(button).borderTopColor;return Promise.all(button.getAnimations().map(animation=>animation.finished.catch(()=>{})));})()`,
      );
      assert.equal(
        await evaluate(
          `getComputedStyle(document.querySelector('${root} button[type=reset]')).borderTopColor === getComputedStyle(document.querySelector('${root}')).color`,
        ),
        true,
        theme + " active feedback",
      );
      await call("CSS.forcePseudoState", {
        nodeId: buttonNode.nodeId,
        forcedPseudoClasses: [],
      });
      const inputNode = await call("DOM.querySelector", {
        nodeId: doc.root.nodeId,
        selector:
          root + " input[type=email]:not([aria-invalid]):not(:disabled)",
      });
      await wait(240);
      const beforeHover = await evaluate(
        `getComputedStyle(document.querySelector('${root} input[type=email]:not([aria-invalid]):not(:disabled)')).backgroundColor`,
      );
      await evaluate(
        `document.querySelector('${root} input[type=email]:not([aria-invalid]):not(:disabled)').blur()`,
      );
      await call("CSS.forcePseudoState", {
        nodeId: inputNode.nodeId,
        forcedPseudoClasses: ["hover"],
      });
      const hovered = await evaluate(
        `getComputedStyle(document.querySelector('${root} input[type=email]:not([aria-invalid]):not(:disabled)')).backgroundColor`,
      );
      assert.equal(hovered, beforeHover, theme + " hover shares focus surface");
      await call("CSS.forcePseudoState", {
        nodeId: inputNode.nodeId,
        forcedPseudoClasses: [],
      });
      await evaluate(
        `document.querySelector('${root} input[type=checkbox]:not(:disabled)').focus()`,
      );
      await key(" ", "Space");
      assert.equal(
        await evaluate(
          `document.querySelector('${root} input[type=checkbox]:not(:disabled)').checked`,
        ),
        true,
      );
      await evaluate(
        `document.querySelector('${root} input[type=radio]').focus()`,
      );
      await key("ArrowRight");
      assert.equal(
        await evaluate(
          `document.querySelectorAll('${root} input[type=radio]')[1].checked`,
        ),
        true,
      );
      await evaluate(
        `document.querySelector('${root} input[type=range]:not(:disabled)').focus()`,
      );
      await key("ArrowRight");
      assert.equal(
        await evaluate(
          `document.querySelector('${root} input[type=range]:not(:disabled)').value`,
        ),
        "51",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('${root} .form-range_value').textContent`,
        ),
        "51",
      );
      await evaluate(
        `document.querySelector('${root} select:not(:disabled)').focus()`,
      );
      await key("ArrowDown");
      await key("Enter");
      assert.notEqual(
        await evaluate(
          `document.querySelector('${root} select:not(:disabled)').value`,
        ),
        "",
      );
      assert.equal(
        await evaluate(
          `(()=>{const t=document.querySelector('${root} textarea:not(:disabled)');t.value='Long project details '.repeat(250);t.dispatchEvent(new Event('input',{bubbles:true}));return t.scrollHeight>=t.clientHeight})()`,
        ),
        true,
      );
      assert.equal(
        await evaluate(
          `(()=>{const d=document.querySelector('${root} input[type=checkbox]:disabled');d.click();return d.checked})()`,
        ),
        false,
      );
      await evaluate(
        `document.querySelector('${root} button[type=reset]').click()`,
      );
      await wait(80);
      assert.equal(
        await evaluate(
          `document.querySelector('${root} .form-range_value').textContent`,
        ),
        "50",
      );
      await evaluate(`document.querySelector('${root}').requestSubmit()`);
      assert.equal(
        await evaluate(
          `document.querySelector('${root} input[type=email]:not([aria-invalid])').matches(':user-invalid')`,
        ),
        true,
        theme + " native user-invalid",
      );
      await key("Escape");
      await evaluate(`document.querySelector('${root}').reset()`);
    }
    await evaluate(
      "document.getElementById('video-viewport-restart').scrollIntoView({block:'center'})",
    );
    await wait(500);
    await call("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await wait(100);
    assert.equal(
      await evaluate(
        "[...document.querySelectorAll('video')].every(v=>v.paused&&v.controls)",
      ),
      true,
      "Reduced motion did not pause videos",
    );
    await call("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
    });
    console.log(
      "Browser interaction checks passed at " +
        width +
        "px: slider keys, markers, 3 dialog variants, focus return, long content, touch backdrop, native fields in 3 themes, reset and reduced motion.",
    );
    await fs.mkdir(".cache/interaction-check", { recursive: true });
    await evaluate("document.getElementById('fields-brand').scrollIntoView()");
    const shot = await call("Page.captureScreenshot", { format: "png" });
    await fs.writeFile(
      ".cache/interaction-check/fields-" + width + ".png",
      Buffer.from(shot.data, "base64"),
    );
  }
} finally {
  await browser.close();
}
