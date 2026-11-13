"use client";

import { AnimationFrame, Arrow, Chip, Dot, Label, Path, stagger } from "@/animations";

/**
 * Training examples seen from above, as small tiles: where the gripper starts
 * (dot), the object (ring) and the path between them. Top row: the original
 * examples, one start pose, nothing moves. Bottom row: varied start poses and
 * an object moved mid-reach that the expert follows.
 */
const TILE_W = 136;
const TILE_H = 92;
const COLS = [20, 172, 324];
const ROW_TOP = 52;
const ROW_BOTTOM = 182;

const SAME_START: [number, number] = [26, 70];
const TOP = [
  { start: SAME_START, end: [100, 30] as [number, number] },
  { start: SAME_START, end: [108, 58] as [number, number] },
  { start: SAME_START, end: [86, 22] as [number, number] },
];
const BOTTOM = [
  { start: [24, 24] as [number, number], end: [106, 60] as [number, number] },
  { start: [110, 76] as [number, number], end: [36, 30] as [number, number] },
  { start: [22, 70] as [number, number], end: [110, 64] as [number, number], was: [62, 26] as [number, number] },
];

function curve(start: [number, number], end: [number, number], ox: number, oy: number, was?: [number, number]): string {
  const [sx, sy] = [ox + start[0], oy + start[1]];
  const [ex, ey] = [ox + end[0], oy + end[1]];
  if (was) {
    const [wx, wy] = [ox + was[0], oy + was[1]];
    return `M${sx} ${sy}Q${(sx + wx) / 2} ${wy + 18} ${wx - 4} ${wy + 10}Q${wx + 18} ${wy + 6} ${ex} ${ey}`;
  }
  return `M${sx} ${sy}Q${(sx + ex) / 2} ${Math.max(sy, ey) + 8} ${ex} ${ey}`;
}

export function DemoHabit() {
  return (
    <AnimationFrame
      title="The habit comes from the examples"
      description="Top row: the original training examples, seen from above. Every reach starts from the same pose and nothing moves, so the expert plans once and the policy learns to look once. Bottom row: new examples with varied starting poses, and one where the object is moved mid-reach and the expert turns to follow it. Trained on those, a policy turns back when the object moves."
      steps={[
        "The original examples: every reach starts from the same pose.",
        "And nothing ever moves. One look at the start is all it ever took.",
        "New examples: varied starting poses.",
        "And objects moved mid-reach, which the expert turns to follow.",
        "Trained on these, a policy turns back when the object moves.",
      ]}
      size={[480, 318]}
    >
      {(step) => (
        <>
          <Label x={20} y={32} tone="ink" size={15} weight={700} anchor="start">
            original examples
          </Label>
          <Label x={460} y={32} tone="muted" size={14} anchor="end" opacity={step >= 1 ? 1 : 0}>
            one look is enough
          </Label>
          <Label x={20} y={162} tone="ink" size={15} weight={700} anchor="start" opacity={step >= 2 ? 1 : 0}>
            new examples
          </Label>

          {TOP.map((demo, i) => (
            <g key={`top-${i}`}>
              <rect x={COLS[i]} y={ROW_TOP} width={TILE_W} height={TILE_H} rx={12} className="t-faint a-fill-soft" />
              <Path d={curve(demo.start, demo.end, COLS[i], ROW_TOP)} tone="action" width={2.5} delay={stagger(i, 120)} />
              <Dot x={COLS[i] + demo.start[0]} y={ROW_TOP + demo.start[1]} r={6} tone={step === 0 ? "mark" : "ink"} />
              <Dot x={COLS[i] + demo.end[0]} y={ROW_TOP + demo.end[1]} r={9} tone="action" hollow />
            </g>
          ))}

          {BOTTOM.map((demo, i) => {
            const shown = i < 2 ? step >= 2 : step >= 3;
            const ox = COLS[i];
            return (
              <g key={`bottom-${i}`} className="a-t" style={{ opacity: shown ? 1 : 0 }}>
                <rect x={ox} y={ROW_BOTTOM} width={TILE_W} height={TILE_H} rx={12} className="t-faint a-fill-soft" />
                <Path d={curve(demo.start, demo.end, ox, ROW_BOTTOM, demo.was)} tone="action" width={2.5} drawn={shown} delay={300} />
                <Dot x={ox + demo.start[0]} y={ROW_BOTTOM + demo.start[1]} r={6} tone="ink" />
                {demo.was ? (
                  <>
                    <circle cx={ox + demo.was[0]} cy={ROW_BOTTOM + demo.was[1]} r={9} className="t-faint a-stroke" fill="none" strokeWidth={2} strokeDasharray="3 3" />
                    <Arrow from={[ox + demo.was[0] + 13, ROW_BOTTOM + demo.was[1]]} to={[ox + demo.end[0] - 14, ROW_BOTTOM + demo.end[1]]} tone="muted" width={1.5} dashed drawn={shown} />
                  </>
                ) : null}
                <Dot x={ox + demo.end[0]} y={ROW_BOTTOM + demo.end[1]} r={9} tone="action" hollow />
              </g>
            );
          })}

          <Chip x={240} y={296} text="the policy learns to turn back" tone="success" variant="soft" mono={false} size={14} opacity={step >= 4 ? 1 : 0} />
        </>
      )}
    </AnimationFrame>
  );
}
