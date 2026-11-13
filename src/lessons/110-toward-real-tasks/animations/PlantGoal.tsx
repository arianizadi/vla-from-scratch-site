"use client";

import { AnimationFrame, Arrow, Chip, Dot, Label, Move, Path, stagger } from "@/animations";

const TABLE = 262;
const STEM_X = 240;
const STEM_TOP = 92;

/** Each side shoot: where it leaves the main stem, its tip, and where it lies once cut. */
const SHOOTS = [
  { base: [STEM_X, 196], tip: [190, 166], rest: [176, TABLE - 3] },
  { base: [STEM_X, 162], tip: [294, 136], rest: [322, TABLE - 3] },
  { base: [STEM_X, 128], tip: [194, 110], rest: [118, TABLE - 3] },
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

export function PlantGoal() {
  return (
    <AnimationFrame
      title="The goal: prune a potted plant"
      description="A potted plant stands on a turntable: one main stem, a flower on top and three side shoots. Holding one of two buttons turns the stand. The job is to cut every side shoot where it meets the main stem; the cut shoots fall to the table while the flower stays untouched. Touching the flower fails the try."
      steps={[
        "A potted plant on a turntable: a main stem, a flower on top, three side shoots.",
        "Holding a button turns the stand, so any shoot can be brought round to the arm.",
        "The job: cut each side shoot where it meets the main stem.",
        "The cut shoots fall away. The flower stays untouched, or the try fails.",
      ]}
      size={[480, 320]}
      hold={[2600, 2600, 2400, 3600]}
    >
      {(step) => (
        <>
          <Path d={`M12 ${TABLE}H468`} tone="faint" width={2} />

          {/* Turntable and its two buttons */}
          <rect x={168} y={TABLE - 20} width={144} height={14} rx={7} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
          <rect x={186} y={TABLE - 6} width={108} height={6} rx={2} className="t-muted a-fill" />
          <Arrow from={[192, TABLE + 14]} to={[288, TABLE + 14]} bend={-10} tone="accent" width={2.5} drawn={step === 1} />
          <Label x={STEM_X} y={TABLE + 40} tone="accent" size={14} weight={700} opacity={step === 1 ? 1 : 0}>
            the stand turns
          </Label>
          <Chip x={392} y={TABLE - 13} text="↺" mono={false} tone="muted" size={15} active={step === 1} />
          <Chip x={428} y={TABLE - 13} text="↻" mono={false} tone="muted" size={15} />
          <Label x={410} y={TABLE + 22} tone="muted" size={14}>
            buttons
          </Label>

          {/* Pot, main stem, flower */}
          <path d={`M216 ${TABLE - 52}H264L257 ${TABLE - 20}H223Z`} className="t-muted a-fill-soft a-stroke" strokeWidth={2} strokeLinejoin="round" />
          <Dot x={STEM_X} y={STEM_TOP - 12} r={26} tone="success" hollow opacity={step === 3 ? 1 : 0} />
          <Path d={`M${STEM_X} ${TABLE - 52}V${STEM_TOP}`} tone="ink" width={4} />
          <g className="t-mark" transform={`translate(${STEM_X} ${STEM_TOP - 12})`}>
            {PETALS.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={7} className="a-fill-soft a-stroke" strokeWidth={1.5} />
            ))}
            <circle r={7} className="a-fill" />
          </g>
          <Label x={STEM_X + 34} y={STEM_TOP - 12} tone="ink" size={14} anchor="start" weight={step === 3 ? 700 : 400}>
            {step === 3 ? "flower: keep it" : "flower"}
          </Label>

          {/* Side shoots: on the stem, then lying on the table once cut */}
          {SHOOTS.map((shoot, i) => {
            const cut = step >= 3;
            const dx = shoot.tip[0] - shoot.base[0];
            const dy = shoot.tip[1] - shoot.base[1];
            const [x, y] = cut ? shoot.rest : shoot.base;
            return (
              <Move key={i} x={x} y={y} rotate={cut ? flat(shoot.base, shoot.tip) : 0.01} opacity={cut ? 0.55 : 1} delay={stagger(i, 160)}>
                <line x1={0} y1={0} x2={dx} y2={dy} className="t-accent a-stroke" strokeWidth={3.5} strokeLinecap="round" />
                <ellipse cx={dx} cy={dy} rx={9} ry={5} className="t-accent a-fill-soft a-stroke" strokeWidth={1.5} />
              </Move>
            );
          })}
          {SHOOTS.map((shoot, i) => (
            <Move key={`cut-${i}`} x={shoot.base[0]} y={shoot.base[1]} opacity={step === 2 ? 1 : 0} delay={stagger(i, 120)}>
              <circle r={9} fill="none" className="t-action a-stroke" strokeWidth={2.5} />
            </Move>
          ))}
          <Label x={116} y={146} tone="accent" size={14} weight={700} opacity={step <= 1 ? 1 : 0}>
            side shoots
          </Label>
          <Label x={116} y={146} tone="action" size={14} weight={700} opacity={step === 2 ? 1 : 0}>
            cut here
          </Label>
          <Label x={84} y={TABLE - 24} tone="accent" size={14} opacity={step === 3 ? 1 : 0}>
            cut off
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
