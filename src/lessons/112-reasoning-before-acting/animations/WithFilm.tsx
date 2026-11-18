"use client";

import type { ReactNode } from "react";
import { NoteSwap } from "./NoteSwap";
import { V2Pipeline } from "./V2Pipeline";

/**
 * A film of the policy in the simulator, below a beat's animation. Nothing loads or plays until the
 * reader presses play (preload none, no autoplay), so reduced motion is respected and the page stays
 * light; the poster is the still. Each caption gives the numbers of the version that was filmed.
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

/** Beat 2: the note driving the arm, drawn, then filmed. */
export function NoteSwapWithFilm() {
  return (
    <div className="flex flex-col gap-4">
      <NoteSwap />
      <Film name="reasoning-two-level" title="Watch it write its note, then cut" size={[1280, 720]}>
        The first version in the simulator, its note shown as it writes it. The last try turns the plant to read a
        hidden label, remembers it and cuts. This version solved 133 of 200 tries with training instructions and 66 of
        200 with new instructions, never seen in training; without a note, a small policy of the same design reading the instruction itself solved 21 of 100. After the last cut a script opens the
        jaws and pulls the arm back.
      </Film>
    </div>
  );
}

/** Beat 5: version two, drawn, then filmed. */
export function V2PipelineWithFilm() {
  return (
    <div className="flex flex-col gap-4">
      <V2Pipeline />
      <Film name="reasoning-v2" title="Watch version two work it out" size={[1280, 720]}>
        The program it wrote and what its memory holds are shown as it works, including an instruction it never saw in
        training, a label it reads, turns away from and still remembers, and a reset after which it turns the plant and
        cuts. This is the final version, with the reset of the next step: 180 of 200 tries with training instructions,
        165 of 200 with new instructions. The reset and the pull-back after the last cut are scripted.
      </Film>
    </div>
  );
}
