/** Usability checks only. Enforce equivalent constraints at the delivery endpoint. */
export function contactError(name: string, raw: string): string {
  const value = raw.trim();
  const limits: Record<string, number> = {
    name: 100,
    email: 254,
    company: 200,
    message: 5000,
  };
  const max = limits[name];
  if (max && raw.length > max) return `Use ${max} characters or fewer.`;
  if (name === "name") {
    if (!value) return "Enter your name.";
    // Single names, short names, every script, diacritics and punctuation are valid.
    if (!/\p{L}/u.test(value) || /\p{Cc}/u.test(value))
      return "Enter a name containing letters.";
  }
  if (name === "email") {
    if (!value) return "Enter your email address.";
    const parts = value.split("@");
    const [local = "", domain = ""] = parts;
    const labels = domain.split(".");
    if (
      parts.length !== 2 ||
      local.length > 64 ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
      local.startsWith(".") ||
      local.endsWith(".") ||
      local.includes("..") ||
      labels.length < 2 ||
      domain.length > 253 ||
      labels.some(
        (label) =>
          !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label),
      ) ||
      !/[a-zA-Z]/.test(labels.at(-1) ?? "")
    )
      return "Enter a complete email address, for example name@example.com.";
  }
  return "";
}

export function setupContactValidation(form: HTMLFormElement): void {
  const controls = [
    ...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    ),
  ];
  const touched = new WeakSet<Element>();
  const summary = form.querySelector<HTMLElement>("[data-validation-summary]");
  const announce = (message: string) => {
    if (!summary) return;
    summary.hidden = !message;
    summary.textContent = message;
  };
  const update = (
    control: HTMLInputElement | HTMLTextAreaElement,
    show: boolean,
  ) => {
    control.setCustomValidity("");
    const error =
      contactError(control.name, control.value) ||
      (control.validity.valid ? "" : "Check this value and try again.");
    control.setCustomValidity(error);
    const message = document.getElementById(`${control.id}-error`);
    if (message) {
      message.textContent = show ? error : "";
      message.hidden = !show || !error;
    }
    if (show && error) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
    return !error;
  };
  for (const control of controls) {
    update(control, false);
    control.addEventListener("blur", () => {
      touched.add(control);
      update(control, true);
    });
    control.addEventListener("input", (event) => {
      if (!(event instanceof InputEvent && event.isComposing))
        update(control, touched.has(control));
      announce("");
      if (form.parentElement?.dataset.state === "failed")
        form.parentElement.dataset.state = "idle";
    });
    control.addEventListener("compositionend", () =>
      update(control, touched.has(control)),
    );
    control.addEventListener("change", () =>
      update(control, touched.has(control)),
    );
  }
  // Keep native semantics/validity, replace browser-localized popovers with inline English.
  form.noValidate = true;
  form.addEventListener(
    "submit",
    (event) => {
      const errors = controls.filter((control) => {
        touched.add(control);
        return !update(control, true);
      });
      if (!errors.length) {
        announce("");
        // Trim single-line boundaries only; never rewrite the user's message.
        controls
          .filter((control) => control instanceof HTMLInputElement)
          .forEach((control) => {
            control.value = control.value.trim();
          });
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      announce(
        `Please check ${errors.length === 1 ? "the highlighted field" : "the highlighted fields"}.`,
      );
      errors[0].focus();
    },
    { capture: true },
  );
  form.addEventListener("reset", () => {
    controls.forEach((control) => {
      touched.delete(control);
      control.setCustomValidity("");
      control.removeAttribute("aria-invalid");
      const message = document.getElementById(`${control.id}-error`);
      if (message) {
        message.textContent = "";
        message.hidden = true;
      }
    });
    announce("");
  });
}
