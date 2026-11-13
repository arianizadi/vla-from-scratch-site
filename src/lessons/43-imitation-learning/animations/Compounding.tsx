"use client";

import { AnimationFrame, Dot, Label, Path } from "@/animations";

const r = (value: number) => Math.round(value * 10) / 10;
/** The expert's path: a gentle curve from bottom left to top right. */
const expert = (t: number): [number, number] => [r(40 + 400 * t), r(214 - 140 * t * t)];
/** The policy's drift away from it: tiny at first, then growing on itself (a toy curve). */
const drift = (t: number) => 2.5 * (Math.exp(3.6 * t) - 1);
const policy = (t: number): [number, number] => {
  const [x, y] = expert(t);
  return [x, r(y + drift(t))];
};

const sample = (from: number, to: number, f: (t: number) => [number, number]) =>
  Array.from({ length: 21 }, (_, i) => {
    const [x, y] = f(from + ((to - from) * i) / 20);
    return `${i === 0 ? "M" : "L"}${x} ${y}`;
  }).join("");

const BAND = 18;
const bandPath = (() => {
  const upper = Array.from({ length: 41 }, (_, i) => expert(i / 40)).map(([x, y]) => [x, r(y - BAND)] as const);
  const lower = Array.from({ length: 41 }, (_, i) => expert(1 - i / 40)).map(([x, y]) => [x, r(y + BAND)] as const);
  return [...upper, ...lower].map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join("") + "Z";
})();

const CUTS = [0, 0.38, 0.68, 1];
const END = policy(1);

export function Compounding() {
  return (
    <AnimationFrame
      title="Small mistakes grow"
      description="The expert's path is a curve with a shaded band around it: the views the policy saw in training. The policy starts on the path, makes a tiny mistake and drifts slightly. Once outside the band, everything it sees is unfamiliar, its next guesses are worse, and it ends far from anywhere it practised. The curve is a toy."
      steps={[
        "The expert's path, and around it the band of views the policy saw in training.",
        "The policy makes a tiny mistake and drifts a little.",
        "Just outside the band the view is unfamiliar, so the next guess is worse.",
        "Mistakes feed on each other. The arm ends far from anything it practised.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <path d={bandPath} className="t-vision a-fill-soft" opacity={0.8} />
          <Path d={sample(0, 1, expert)} tone="ink" width={2} dashed drawn />
          <Label x={440} y={34} tone="ink" size={14} anchor="end" weight={700}>
            {"expert's path"}
          </Label>
          <Label x={44} y={252} tone="vision" size={14} anchor="start">
            seen in training
          </Label>

          {[0, 1, 2].map((part) => (
            <Path
              key={part}
              d={sample(CUTS[part], CUTS[part + 1], policy)}
              tone="action"
              width={3}
              drawn={step >= part + 1}
            />
          ))}
          <Dot x={END[0]} y={END[1]} r={6} tone="action" opacity={step >= 3 ? 1 : 0} delay={500} />
          <Label x={END[0]} y={END[1] + 30} tone="action" size={14} anchor="end" weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
            the policy, lost
          </Label>
          <Label x={250} y={244} tone="failure" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            never seen this view
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
