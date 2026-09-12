import { useEffect, useRef, useState } from "react";

export type Beat = {
  id: string;
  title: string;
  bullets: string[];
  still: string;
  video: string | null;
};

type Props = {
  beats: Beat[];
  address: string;
  price: string;
};

/** Hold the frame for most of the beat, then snap. No lingering crossfade. */
const HOLD = 0.97;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Film({ beats, address, price }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [progress, setProgress] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduce(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const n = beats.length;
  const x = progress * Math.max(n - 1, 1);
  const from = Math.min(Math.floor(x), Math.max(n - 1, 0));
  const to = Math.min(from + 1, n - 1);
  const rawT = reduce || from === to ? 0 : Math.min(x - from, 1);
  const showTo = !reduce && from !== to && rawT >= HOLD;
  const visible = showTo ? to : from;
  const current = beats[visible] ?? beats[0];
  const scrubFrom = showTo ? 1 : HOLD > 0 ? Math.min(rawT / HOLD, 1) : 0;

  useEffect(() => {
    if (reduce) return;
    const apply = (idx: number, local: number) => {
      const v = videoRefs.current[idx];
      if (!v || !beats[idx]?.video || !v.duration || Number.isNaN(v.duration)) return;
      v.pause();
      v.currentTime = Math.min(Math.max(local, 0), 1) * v.duration;
    };
    apply(visible, showTo ? 0 : scrubFrom);
  }, [visible, showTo, scrubFrom, reduce, beats]);

  return (
    <div className="film-track" ref={trackRef} style={{ height: `${n * 100}vh` }}>
      <div className="film-stage">
        {beats.map((beat, idx) => {
          const on = idx === visible;
          const near = Math.abs(idx - from) <= 1;
          return (
            <div
              key={beat.id}
              className="film-layer"
              style={{ opacity: on ? 1 : 0, zIndex: idx, visibility: on ? "visible" : "hidden" }}
              aria-hidden={!on}
            >
              {beat.video && near ? (
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  className="film-media"
                  src={beat.video}
                  poster={beat.still}
                  muted
                  playsInline
                  preload={idx === visible ? "auto" : "metadata"}
                  disablePictureInPicture
                />
              ) : (
                <img className="film-media" src={beat.still} alt="" decoding="async" />
              )}
            </div>
          );
        })}
        <div className="film-scrim" />
        <p className="film-kicker">
          {address}
          <span>{price}</span>
        </p>
        <div className="film-copy">
          <p className="film-hint">Scroll to move the camera</p>
          <h2>{current.title}</h2>
          <ul>
            {current.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
