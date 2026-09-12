import { useRef, useState } from "react";
import type { Listing } from "./types";

type Props = { listing: Listing };

export default function Walkthrough({ listing }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="walk">
      <p className="eyebrow">Cinematic walkthrough</p>
      <h2>Move through the house</h2>
      <p className="lede">
        A 56-second muted walk from the street through the great room, kitchen, primary, loft, and yard. Arrival also
        has a generated clip in the scroll film above.
      </p>
      <div className="walk-stage">
        <video
          ref={ref}
          className="walk-video"
          src={listing.walkthrough}
          poster="/stills/01-arrival.jpg"
          muted
          playsInline
          preload="metadata"
          onEnded={() => setPlaying(false)}
        />
        <button type="button" className="walk-play" onClick={toggle}>
          {playing ? "Pause" : "Play walkthrough"}
        </button>
      </div>
    </section>
  );
}
