"use client";

import { AnimationFrame, Arrow, Dot, Label, Move, Path, lerp } from "@/animations";

const ACTION: [number, number] = [104, 204];
const NOISE: [number, number] = [392, 72];
const mix = (s: number): [number, number] => [lerp(ACTION[0], NOISE[0], s), lerp(ACTION[1], NOISE[1], s)];

const dx = NOISE[0] - ACTION[0];
const dy = NOISE[1] - ACTION[1];
const unit = Math.hypot(dx, dy);
const ARROW: [number, number] = [(dx / unit) * 76, (dy / unit) * 76];
/** Beside the middle of the arrow, on the side away from the line's labels. */
const TARGET_LABEL: [number, number] = [ARROW[0] / 2 + (-dy / unit) * 22, ARROW[1] / 2 + (dx / unit) * 22];

export function NoisePath() {
  const s = (step: number) => (step >= 4 ? 0.7 : 0.3);
  return (
    <AnimationFrame
      title="One training example"
      description="Training takes a demonstrated action and random noise of the same size. It picks a noise level between 0 and 1 and mixes the two: a point on the straight line from the action (level 0) to the noise (level 1). The policy sees that point and is trained to point along the line, from the action toward the noise. Every point on the line has the same answer."
      steps={[
        "Take one demonstrated action: a point in the space of all actions.",
        "Draw random noise of the same size.",
        "Pick a noise level and blend the two: a point on the straight line between them.",
        "The policy sees the blend and learns which way the line runs.",
        "A different level, the same direction. One clear answer per training example.",
      ]}
      size={[480, 270]}
    >
      {(step) => {
        const [mx, my] = mix(s(step));
        return (
          <>
            <Path d={`M${ACTION[0]} ${ACTION[1]}L${NOISE[0]} ${NOISE[1]}`} tone="faint" dashed drawn={step >= 2} width={2} />

            <Dot x={ACTION[0]} y={ACTION[1]} r={9} tone="action" />
            <Label x={ACTION[0]} y={ACTION[1] + 26} tone="action" weight={700}>
              action
            </Label>
            <Label x={ACTION[0]} y={ACTION[1] + 46} tone="faint" size={13} opacity={step >= 2 ? 1 : 0}>
              no noise
            </Label>

            <Dot x={NOISE[0]} y={NOISE[1]} r={9} tone="muted" opacity={step >= 1 ? 1 : 0} scale={step >= 1 ? 1 : 0.4} />
            <Label x={NOISE[0]} y={NOISE[1] - 26} tone="muted" weight={700} opacity={step >= 1 ? 1 : 0}>
              noise
            </Label>
            <Label x={NOISE[0]} y={NOISE[1] + 28} tone="faint" size={13} opacity={step >= 2 && step < 4 ? 1 : 0}>
              all noise
            </Label>

            <Move x={mx} y={my} opacity={step >= 2 ? 1 : 0}>
              <Arrow from={[0, 0]} to={ARROW} tone="accent" width={3} drawn={step >= 3} />
              <Dot x={0} y={0} r={7} tone="ink" />
              <Label x={14} y={26} tone="ink" size={14} anchor="start" mono>
                {`noise ${Math.round(s(step) * 100)}%`}
              </Label>
              <Label x={TARGET_LABEL[0]} y={TARGET_LABEL[1]} tone="accent" size={14} weight={700} anchor="start" opacity={step >= 3 ? 1 : 0}>
                learn this
              </Label>
            </Move>
          </>
        );
      }}
    </AnimationFrame>
  );
}
