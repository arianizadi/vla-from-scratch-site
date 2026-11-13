"use client";

import { AnimationFrame, Axes, Bracket, Label, Line, Path, scale } from "@/animations";

const LOSS = { x: 40, y: 50, w: 170, h: 96 };
const LX = scale([0, 1], [LOSS.x, LOSS.x + LOSS.w]);
const LY = scale([0, 1], [LOSS.y + LOSS.h, LOSS.y]);
const CURVE: [number, number][] = Array.from({ length: 31 }, (_, i) => {
  const t = i / 30;
  return [Math.round(LX(t) * 10) / 10, Math.round(LY(0.06 + 0.88 * Math.exp(-t * 5)) * 10) / 10];
});

const BAR = { x: 350, base: 146, h: 96, w: 124 };

const STRIP = { x: 40, y: 224, w: 400 };
const LOOK = 0.16;

export function ScoreVsRobot() {
  return (
    <AnimationFrame
      title="A good score, a robot that fails"
      description="During training the loss falls nicely, yet on the robot the policy succeeds 0 times. The reason: most moments of a demonstration can be guessed from the arm's own motion, and only the first moments need the camera. Fitting the easy part already gives a low loss."
      steps={[
        "Training: the loss falls nicely.",
        "On the robot: no successes at all.",
        "Why? Most of a demonstration can be guessed from how the arm is already moving…",
        "…only the first moments need the eyes. Fitting the easy part already gives a low loss.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          <Label x={LOSS.x + LOSS.w / 2} y={26} tone="ink" size={15} weight={700}>
            training loss
          </Label>
          <Axes x={LOSS.x} y={LOSS.y} w={LOSS.w} h={LOSS.h} />
          <Line points={CURVE} tone="accent" width={3} drawn />
          <Label x={LX(0.62)} y={LY(0.5)} tone="success" size={14} weight={700}>
            looks great
          </Label>

          <Label x={BAR.x} y={26} tone="ink" size={15} weight={700} opacity={step >= 1 ? 1 : 0.3}>
            successes on the robot
          </Label>
          <rect className="t-faint a-stroke" x={BAR.x - BAR.w / 2} y={BAR.base - BAR.h} width={BAR.w} height={BAR.h} rx={6} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
          <Path d={`M${BAR.x - 80} ${BAR.base}H${BAR.x + 80}`} tone="faint" width={2} />
          <Label x={BAR.x} y={BAR.base - BAR.h / 2} tone="failure" size={22} weight={700} opacity={step >= 1 ? 1 : 0}>
            0 / 100
          </Label>

          <g className="a-t" style={{ opacity: step >= 2 ? 1 : 0 }}>
            <rect className="t-vision a-fill" x={STRIP.x} y={STRIP.y - 10} width={STRIP.w * LOOK} height={20} rx={4} style={{ fillOpacity: step >= 3 ? 0.9 : 0.35 }} />
            <rect className="t-action a-fill-soft a-stroke" x={STRIP.x + STRIP.w * LOOK + 3} y={STRIP.y - 10} width={STRIP.w * (1 - LOOK) - 3} height={20} rx={4} strokeWidth={1} />
          </g>
          <Label x={STRIP.x + STRIP.w} y={STRIP.y - 26} tone="muted" size={13} anchor="end" opacity={step >= 2 ? 1 : 0}>
            one demonstration, start to end
          </Label>
          <Bracket x1={STRIP.x + STRIP.w * LOOK + 3} x2={STRIP.x + STRIP.w} y={STRIP.y + 22} label="guessable from the arm's own motion" below tone="action" opacity={step >= 2 ? 1 : 0} />
          <Label x={STRIP.x + (STRIP.w * LOOK) / 2} y={STRIP.y - 26} tone="vision" size={14} weight={700} opacity={step >= 3 ? 1 : 0}>
            needs eyes
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
