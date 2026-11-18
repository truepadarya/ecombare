/** Route layout corrections through the existing smooth-scroll owner. */
export function correctScroll(top: number): void {
  if (!Number.isFinite(top)) return;
  const event = new CustomEvent<number>("site:correct-scroll", {
    detail: Math.max(0, top),
    cancelable: true,
  });
  if (document.dispatchEvent(event))
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
}
