"use client";

import { AnimationFrame, Arrow, Chip, Gripper, Label, Move, Path } from "@/animations";
import { Ring } from "./parts";

const TABLE = 262;
const STEM_X = 240;
const STEM_TOP = 96;
const FLOWER_Y = STEM_TOP - 12;

/** Two side shoots: where each leaves the main stem, its tip, where the jaws cut it, and where it lies once cut. */
const SHOOTS = [
  { base: [STEM_X, 206], tip: [186, 182], cut: [216, 195], rest: [150, TABLE - 3] },
  { base: [STEM_X, 160], tip: [296, 138], cut: [274, 147], rest: [312, TABLE - 3] },
] as const;

/** Rotation that lays a shoot flat on the table, pointing the way it pointed. */
function flat(base: readonly number[], tip: readonly number[]): number {
  const angle = (Math.atan2(tip[1] - base[1], tip[0] - base[0]) * 180) / Math.PI;
  const target = tip[0] < base[0] ? 180 : 0;
  let turn = target - angle;
  while (turn > 180) turn -= 360;
  while (turn <= -180) turn += 360;
  return Math.round(turn * 10) / 10;
}

const PETALS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [Math.round(Math.cos(a) * 11 * 10) / 10, Math.round(Math.sin(a) * 11 * 10) / 10];
});

/** The hand: resting top right, clear of the flower's label, or with its fingertips on the upper shoot's cut point. */
const REST = { x: 436, y: 46, open: 1 };
const HAND = [REST, REST, { x: SHOOTS[1].cut[0], y: SHOOTS[1].cut[1] - 40, open: 0 }, REST, REST];

export function PruneJob() {
  return (
    <AnimationFrame
      title="The job, seen from the side"
      description="A potted plant stands on a turntable with two buttons: a main stem, a flower on top and two side shoots. Holding a button turns the stand. To cut a shoot, the jaws shut on it a little way out from the main stem and hold it there. Touching the flower, or pushing hard on or cutting the main stem, fails the try. At the end both shoots lie on the table and the flower is whole: the plant is pruned."
      steps={[
        "A potted plant on a turntable: a main stem, a flower on top, side shoots.",
        "Holding one of two buttons turns the stand, one button for each way.",
        "To cut a shoot, the jaws shut on it a little out from the stem and hold.",
        "Touch the flower, or push or cut the main stem, and the try fails.",
        "Every side shoot cut, the flower whole: the plant is pruned.",
      ]}
      size={[480, 320]}
      hold={[2600, 2600, 2800, 3000, 3600]}
    >
      {(step) => {
        const hand = HAND[step];
        return (
          <>
            <Path d={`M12 ${TABLE}H468`} tone="faint" width={2} />

            {/* Turntable and its two buttons */}
            <rect x={168} y={TABLE - 20} width={144} height={14} rx={7} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
            <rect x={186} y={TABLE - 6} width={108} height={6} rx={2} className="t-muted a-fill" />
            <Arrow from={[192, TABLE + 16]} to={[288, TABLE + 16]} bend={-10} tone="accent" width={2.5} drawn={step === 1} />
            <Label x={STEM_X} y={TABLE + 40} tone="accent" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
              turns while a button is held
            </Label>
            <Chip x={404} y={TABLE - 13} text="↺" mono={false} tone="muted" size={15} />
            <Chip x={440} y={TABLE - 13} text="↻" mono={false} tone={step === 1 ? "accent" : "muted"} variant={step === 1 ? "solid" : "soft"} size={15} />
            <Label x={422} y={TABLE + 22} tone="muted" size={14}>
              buttons
            </Label>

            {/* Pot, main stem, flower */}
            <path d={`M216 ${TABLE - 52}H264L257 ${TABLE - 20}H223Z`} className="t-muted a-fill-soft a-stroke" strokeWidth={2} strokeLinejoin="round" />
            <Path d={`M${STEM_X} ${TABLE - 52}V${STEM_TOP}`} tone="ink" width={4} />
            <Path d={`M${STEM_X} ${TABLE - 54}V${STEM_TOP + 12}`} tone="failure" width={7} opacity={step === 3 ? 0.55 : 0} dashed />
            <g className="t-mark" transform={`translate(${STEM_X} ${FLOWER_Y})`}>
              {PETALS.map(([px, py], i) => (
                <circle key={i} cx={px} cy={py} r={7} className="a-fill-soft a-stroke" strokeWidth={1.5} />
              ))}
              <circle r={7} className="a-fill" />
            </g>
            <Ring x={STEM_X} y={FLOWER_Y} r={27} tone="failure" opacity={step === 3 ? 1 : 0} />
            <Ring x={STEM_X} y={FLOWER_Y} r={27} tone="success" opacity={step === 4 ? 1 : 0} />
            <Label x={STEM_X + 36} y={FLOWER_Y} tone="ink" size={14} anchor="start" opacity={step === 3 ? 0 : 1} weight={step === 4 ? 700 : 400}>
              {step === 4 ? "flower: whole ✓" : "flower"}
            </Label>
            <Label x={STEM_X - 36} y={FLOWER_Y} tone="failure" size={14} anchor="end" weight={700} opacity={step === 3 ? 1 : 0}>
              touch it: fail ✗
            </Label>
            <Label x={STEM_X - 14} y={128} tone="failure" size={14} anchor="end" weight={700} opacity={step === 3 ? 1 : 0}>
              push or cut
            </Label>
            <Label x={STEM_X - 14} y={148} tone="failure" size={14} anchor="end" weight={700} opacity={step === 3 ? 1 : 0}>
              the stem: fail ✗
            </Label>

            {/* Side shoots: on the stem, then lying on the table once cut */}
            {SHOOTS.map((shoot, i) => {
              const cut = step === 4;
              const dx = shoot.tip[0] - shoot.base[0];
              const dy = shoot.tip[1] - shoot.base[1];
              const [x, y] = cut ? shoot.rest : shoot.base;
              return (
                <Move key={i} x={x} y={y} rotate={cut ? flat(shoot.base, shoot.tip) : 0.01} opacity={cut ? 0.55 : 1} delay={i * 160}>
                  <line x1={0} y1={0} x2={dx} y2={dy} className="t-accent a-stroke" strokeWidth={3.5} strokeLinecap="round" />
                  <ellipse cx={dx} cy={dy} rx={9} ry={5} className="t-accent a-fill-soft a-stroke" strokeWidth={1.5} />
                </Move>
              );
            })}
            <Label x={128} y={200} tone="accent" size={14} weight={700} opacity={step <= 1 ? 1 : 0}>
              side shoots
            </Label>
            <Ring x={SHOOTS[1].cut[0]} y={SHOOTS[1].cut[1]} r={11} tone="action" opacity={step === 2 ? 1 : 0} />
            <Label x={322} y={188} tone="action" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
              jaws shut,
            </Label>
            <Label x={322} y={208} tone="action" size={14} weight={700} anchor="start" opacity={step === 2 ? 1 : 0}>
              held a moment
            </Label>
            <Label x={84} y={TABLE - 26} tone="accent" size={14} opacity={step === 4 ? 1 : 0}>
              cut off
            </Label>

            {/* The hand */}
            <Gripper x={hand.x} y={hand.y} open={hand.open} tone="ink" size={1} />
          </>
        );
      }}
    </AnimationFrame>
  );
}
