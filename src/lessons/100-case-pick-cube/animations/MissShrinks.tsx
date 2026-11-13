"use client";

import { AnimationFrame, Bracket, Label, Move, stagger } from "@/animations";

/* From above: where the hand closed around the cube, early and late in
   training. The scale is real (16 drawing units per cm); the scatter is a
   sketch around the median misses the lab measured: about 4 cm early, under
   1 cm at the end. */

const CM = 16;
const CX = 160;
const CY = 146;
const CUBE = 4.5 * CM;

/** Fourteen tries: a direction and a share of the typical miss, fixed so every render draws the same. */
const TRIES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const share = 0.45 + ((i * 53) % 100) / 100;
  return [Math.cos(angle) * share, Math.sin(angle) * share];
});
/** Typical miss in each step, in cm. */
const MISS = [0, 4, 2, 0.7];
const LABEL = ["", "about 4 cm off", "about 2 cm off", "under 1 cm off"];

export function MissShrinks() {
  return (
    <AnimationFrame
      title="First the right place, then precision"
      description="The red cube seen from above, with a ring about 2 cm around its centre: a grasp closed inside it usually holds. Early in training the hand already closes around the cube, but about 4 cm off, mostly outside the ring. With more practice the misses shrink to about 2 cm, and in the end to under 1 cm, where nearly every grasp holds."
      steps={[
        "From above: the cube, and a ring about 2 cm around its centre. Close inside it, and the grasp usually holds.",
        "Early in training, the hand already goes to the cube, but closes about 4 cm off.",
        "More practice: the misses shrink.",
        "Well trained: under 1 cm off. Now it lifts the cube in more than 9 tries out of 10.",
      ]}
      size={[480, 290]}
      hold={[2800, 2600, 2200, 3600]}
    >
      {(step) => {
        const miss = MISS[step];
        return (
          <>
            <rect x={CX - CUBE / 2} y={CY - CUBE / 2} width={CUBE} height={CUBE} rx={6} className="t-action a-fill-soft a-stroke" strokeWidth={2} />
            <circle cx={CX} cy={CY} r={2 * CM} fill="none" className="t-success a-stroke" strokeWidth={2} strokeDasharray="5 4" />
            {TRIES.map(([dx, dy], i) => (
              <Move key={i} x={CX + dx * miss * CM} y={CY + dy * miss * CM} opacity={step === 0 ? 0 : 1} delay={stagger(i, 30)}>
                <path d="M-5 -5L5 5M5 -5L-5 5" className={`t-${miss > 2.5 ? "failure" : miss > 1 ? "muted" : "ink"} a-stroke`} strokeWidth={2.5} strokeLinecap="round" />
              </Move>
            ))}
            <Bracket x1={300} x2={300 + 2 * CM} y={238} label="2 cm" tone="muted" below />

            <Label x={300} y={96} tone="muted" size={14} anchor="start">
              × = where the hand closed
            </Label>
            <Label x={300} y={126} tone="success" size={14} anchor="start">
              ring = close enough
            </Label>
            <Label x={300} y={176} tone={miss > 2.5 ? "failure" : "ink"} size={18} weight={700} anchor="start" opacity={step === 0 ? 0 : 1}>
              {LABEL[step] || LABEL[1]}
            </Label>
            <Label x={300} y={202} tone="muted" size={14} anchor="start" opacity={step === 0 ? 0 : 1}>
              {step === 3 ? "late in training" : step === 2 ? "more practice" : "early in training"}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}
