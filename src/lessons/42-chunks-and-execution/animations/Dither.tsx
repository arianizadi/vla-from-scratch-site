"use client";

import { AnimationFrame, Dot, Label, Path } from "@/animations";

const X0 = 50;
const X1 = 430;
const AMP = 42;
const PANELS = [90, 236];
const DECISIONS = 10;
/** Which way each fresh decision picked: 1 over the block, -1 under it (a fixed toy sequence). */
const PICKS = [1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1];

const r = (value: number) => Math.round(value * 10) / 10;
const routeY = (centre: number, x: number, side: number) => r(centre - side * AMP * Math.sin((Math.PI * (x - X0)) / (X1 - X0)));
const route = (centre: number, side: number) =>
  Array.from({ length: 41 }, (_, i) => {
    const x = X0 + (i / 40) * (X1 - X0);
    return `${i === 0 ? "M" : "L"}${r(x)} ${routeY(centre, x, side)}`;
  }).join("");

const xAt = (i: number) => r(X0 + (i / DECISIONS) * (X1 - X0));
const ZIGZAG = PICKS.map((side, i) => [xAt(i), routeY(PANELS[0], xAt(i), side)] as const);
const ZIGZAG_D = ZIGZAG.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join("");

export function Dither() {
  return (
    <AnimationFrame
      title="Deciding every step zigzags"
      description="A path must go around a block, over it or under it; both are fine. A policy that decides at every step draws a fresh choice each time, flips between over and under, and its path cuts through the block. A policy that plans a chunk commits to one way for many steps and moves smoothly around."
      steps={[
        "Two good ways around the block: over it or under it.",
        "Deciding every step: each fresh pick may choose the other way.",
        "Flipping between two good plans makes a bad one: straight into the block.",
        "A chunk commits to one way for many steps: one smooth motion.",
      ]}
      size={[480, 316]}
      hold={[2200, 2600, 2600, 3400]}
    >
      {(step) => (
        <>
          {PANELS.map((centre, index) => (
            <g key={centre}>
              <Label x={16} y={centre - 66} tone="ink" size={14} anchor="start" weight={700}>
                {index === 0 ? "decide every step" : "one chunk at a time"}
              </Label>
              <Path d={route(centre, 1)} tone="faint" dashed drawn width={1.5} />
              <Path d={route(centre, -1)} tone="faint" dashed drawn width={1.5} />
              <rect x={212} y={centre - 18} width={56} height={36} rx={6} className="t-muted a-fill-soft a-stroke" strokeWidth={1.5} />
              <Dot x={X0} y={centre} r={6} tone="ink" />
              <Dot x={X1} y={centre} r={9} tone="ink" hollow />
            </g>
          ))}

          <Path d={ZIGZAG_D} tone="action" width={2.5} drawn={step >= 1} />
          {ZIGZAG.map(([x, y], i) => (
            <Dot key={i} x={x} y={y} r={4} tone="accent" opacity={step >= 1 ? 1 : 0} delay={i * 70} />
          ))}
          <Label x={240} y={PANELS[0] + 60} tone="failure" size={14} weight={700} opacity={step >= 2 ? 1 : 0}>
            bumps into it
          </Label>

          <Path d={route(PANELS[1], 1)} tone="action" width={2.5} drawn={step >= 3} />
          <Dot x={X0} y={PANELS[1]} r={6} tone="accent" opacity={step >= 3 ? 1 : 0} />
          <Label x={240} y={PANELS[1] + 60} tone="success" size={14} weight={700} opacity={step >= 3 ? 1 : 0} delay={400}>
            smooth and around
          </Label>
          <Label x={464} y={PANELS[0] - 66} tone="accent" size={13} anchor="end" opacity={step >= 1 ? 1 : 0}>
            ● a look
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
