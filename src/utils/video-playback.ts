export function initializeVideoPlayback(root: ParentNode = document) {
  const videos = [
    ...root.querySelectorAll<HTMLVideoElement>("video[data-video-playback]"),
  ];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups: (() => void)[] = [];
  for (const video of videos) {
    const mode = video.dataset.videoPlayback;
    const rate = Number(video.dataset.videoRate);
    if (Number.isFinite(rate) && rate > 0) video.playbackRate = rate;
    const automatic = mode !== "manual" && video.muted;
    const viewport = mode?.startsWith("viewport");
    const initialControls = video.controls;
    const minimalControls = ["minimal", "none"].includes(
      video.dataset.videoControls ?? "",
    );
    let visible = !viewport;
    let userPaused = false;
    let internalPause = false;
    let pending = false;
    const startRatio = Math.max(
      0,
      Math.min(0.99, Number(video.dataset.videoStartAt) || 0),
    );
    let reset = startRatio > 0;
    let disposed = false;
    const allowed = () =>
      !disposed &&
      automatic &&
      video.muted &&
      visible &&
      !document.hidden &&
      !reduced.matches &&
      !userPaused;
    const pause = () => {
      if (!video.paused) {
        internalPause = true;
        video.pause();
      }
    };
    const rewind = () => {
      if (!reset) return;
      if (startRatio > 0 && !Number.isFinite(video.duration)) return;
      try {
        video.currentTime = startRatio > 0 ? video.duration * startRatio : 0;
        reset = false;
      } catch {}
    };
    const sync = () => {
      video.controls =
        !minimalControls &&
        (initialControls || reduced.matches || !automatic || !video.muted);
      if (!video.muted && visible && !document.hidden && !disposed) return;
      if (reduced.matches && visible && !document.hidden && !disposed) return;
      if (!allowed()) {
        if (automatic) pause();
        return;
      }
      rewind();
      if (video.ended || pending || !video.paused) return;
      pending = true;
      void video
        .play()
        .then(() => {
          pending = false;
          if (!allowed()) pause();
        })
        .catch(() => {
          pending = false;
          video.controls = !minimalControls;
        });
    };
    const observer =
      viewport && automatic
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const next =
                  entry.isIntersecting && entry.intersectionRatio >= 0.25;
                if (
                  next &&
                  !visible &&
                  mode === "viewport-restart" &&
                  !userPaused
                )
                  reset = true;
                visible = next;
                sync();
              }
            },
            { threshold: [0, 0.25] },
          )
        : null;
    observer?.observe(video);
    const onPause = () => {
      if (internalPause) internalPause = false;
      else if (!video.ended) userPaused = true;
    };
    const onPlay = () => {
      rewind();
      userPaused = false;
      if (document.hidden) pause();
      if (!video.muted) {
        for (const other of document.querySelectorAll<HTMLVideoElement>(
          "video",
        )) {
          if (other !== video && !other.muted) other.pause();
        }
      }
    };
    const onVisibility = () => {
      if (document.hidden) pause();
      else sync();
    };
    const onVolume = () => {
      if (!video.muted && !video.paused) {
        for (const other of document.querySelectorAll<HTMLVideoElement>(
          "video",
        )) {
          if (other !== video && !other.muted) other.pause();
        }
      }
      sync();
    };
    const onReduced = () => {
      if (reduced.matches) pause();
      sync();
    };
    const onMetadata = () => {
      rewind();
      sync();
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("loadedmetadata", onMetadata);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onReduced);
    sync();
    cleanups.push(() => {
      disposed = true;
      observer?.disconnect();
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("loadedmetadata", onMetadata);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReduced);
      pause();
    });
  }
  return () => cleanups.forEach((dispose) => dispose());
}
