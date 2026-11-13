"use client";

import { AnimationFrame, Gripper, Label, stagger } from "@/animations";

const W = 80;
const H = 76;
const GAP = 8;
const LEFT = 240 - (5 * W + 4 * GAP) / 2;
const ROWS = [74, 166];

/** Where the cube sits in each tile (made-up layouts), and which tries fail. */
const CUBES = [-18, 14, -4, 22, -22, 6, -14, 18, -8, 24];
const FAILS = new Set([3, 8]);
const CUBE = 15;
const GRIP = 0.5;
const GRIP_TIPS = 21;

function Check({ x, y, ok, opacity, delay }: { x: number; y: number; ok: boolean; opacity: number; delay: number }) {
  return (
    <g className={`a-t ${ok ? "t-success" : "t-failure"}`} style={{ transform: `translate(${x}px, ${y}px)`, opacity, transitionDelay: `${delay}ms` }}>
      <circle r={9} className="a-fill-surface a-stroke" strokeWidth={2} />
      <path
        d={ok ? "M-4 0.5l3 3l5.5 -6" : "M-3.5 -3.5l7 7M3.5 -3.5l-7 7"}
        className="a-stroke"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function CountSuccesses() {
  return (
    <AnimationFrame
      title="Grade it on new tables"
      description="Ten table layouts the policy never saw in training, each with the cube in a different place. The policy acts in each one. In this made-up example it lifts the cube in eight and misses in two, so its success rate is 8 out of 10."
      steps={[
        "Ten table layouts the policy never saw in training.",
        "Let it act in each one, from start to finish.",
        "Some grasps hold, some miss.",
        "Count them: here 8 of 10 (a made-up example). That is the grade.",
      ]}
      size={[480, 280]}
    >
      {(step) => (
        <>
          {CUBES.map((offset, index) => {
            const row = Math.floor(index / 5);
            const cx = LEFT + (index % 5) * (W + GAP) + W / 2;
            const cy = ROWS[row];
            const table = cy + H / 2 - 12;
            const fail = FAILS.has(index);
            const lifted = step >= 2 && !fail;
            const cubeX = cx + offset;
            // A miss lands beside the cube, on the side towards the middle of the tile, so it stays inside.
            const gripX = step >= 1 ? cubeX + (fail ? (offset > 0 ? -15 : 15) : 0) : cx;
            const gripTips = step === 0 ? cy - 10 : lifted ? table - 22 : table - 2;
            const delay = stagger(index, 60);
            return (
              <g key={index}>
                <rect className="t-faint a-fill-surface a-stroke" x={cx - W / 2} y={cy - H / 2} width={W} height={H} rx={8} strokeWidth={1.5} />
                <path className="t-faint a-stroke" d={`M${cx - W / 2 + 6} ${table}H${cx + W / 2 - 6}`} strokeWidth={1.5} />
                <g
                  className="a-t t-action"
                  style={{ transform: `translate(${cubeX}px, ${lifted ? table - 20 : table}px)`, transitionDelay: `${delay + 120}ms` }}
                >
                  <rect className="a-fill" x={-CUBE / 2} y={-CUBE} width={CUBE} height={CUBE} rx={2} />
                </g>
                <Gripper x={gripX} y={gripTips - GRIP_TIPS} open={step >= 2 && !fail ? 0.3 : step >= 2 ? 0 : 1} size={GRIP} tone="ink" delay={delay} />
                <Check x={cx + W / 2 - 12} y={cy - H / 2 + 12} ok={!fail} opacity={step >= 3 ? 1 : 0} delay={delay} />
              </g>
            );
          })}
          <Label x={240} y={248} tone="ink" size={16} weight={700} opacity={step >= 3 ? 1 : 0} delay={500}>
            8 of 10 lifted: a success rate of 80%
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
