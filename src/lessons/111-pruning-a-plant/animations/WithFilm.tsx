"use client";

import type { ReactNode } from "react";
import { TurnOnPurpose } from "./TurnOnPurpose";
import { Wander } from "./Wander";

/**
 * A film of the learned policy in the simulator, below a beat's animation. Nothing loads or plays
 * until the reader presses play (preload none, no autoplay), so reduced motion is respected and
 * the page stays light; the poster is the still.
 */
function Film({ name, title, size, children }: { name: string; title: string; size: [number, number]; children: ReactNode }) {
  const src = `/video/${name}.mp4`;
  return (
    <figure className="image-figure">
      <video
        controls
        preload="none"
        playsInline
        muted
        poster={`/video/${name}.jpg`}
        width={size[0]}
        height={size[1]}
        aria-label={title}
        className="block h-auto w-full"
      >
        <source src={src} type="video/mp4" />
        <a href={src} className="text-link">
          {title} (MP4)
        </a>
      </video>
      <figcaption>
        <strong>{title}.</strong> {children}
      </figcaption>
    </figure>
  );
}

/** Beat 3: the turning, drawn, then filmed. */
export function TurnWithFilm() {
  return (
    <div className="flex flex-col gap-4">
      <TurnOnPurpose />
      <Film name="flower-step7-turn-the-plant-and-cut" title="Watch it turn, then cut" size={[1920, 1080]}>
        The learned robot in the simulator, partway through training, when it pruned 83 plants in 100: the same robot
        whose button presses were recorded. After the cut a script opens the jaws and pulls the arm back.
      </Film>
    </div>
  );
}

/** Beat 5: the slow, wandering whole task, drawn, then filmed. */
export function WanderWithFilm() {
  return (
    <div className="flex flex-col gap-4">
      <Wander />
      <Film name="flower-step8-prune" title="Watch it prune a whole plant" size={[1280, 720]}>
        The learned robot partway through training, when it pruned 84 plants in 100. Four of the eleven recorded tries
        are shown; quiet stretches play at double speed. After the last cut a script opens the jaws and pulls the arm
        back.
      </Film>
    </div>
  );
}
