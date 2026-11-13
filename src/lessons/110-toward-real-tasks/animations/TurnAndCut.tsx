"use client";

import { AnimationFrame, Chip, Gripper, Label, Move } from "@/animations";

const CX = 240;
const CY = 146;
const STAND = 92;

/** Two side shoots, at their angles on the stand before any turn. */
const SHOOTS = [-30, 120];
/** The stand's total turn in each step, and the button held (0 none, 1 clockwise, -1 counter-clockwise). */
const TURN = [0, 120, 120, -30, -30];
const BUTTON = [0, 1, 0, -1, 0];
/** Shoots cut by the end of each step. */
const CUT = [0, 0, 1, 1, 2];
/** Where the hand is: resting, or in at the shoot facing it. */
const REACH = [false, false, true, false, true];

const TICKS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [Math.round(Math.cos(a) * r * 10) / 10, Math.round(Math.sin(a) * r * 10) / 10];
};

export function TurnAndCut() {
  return (
    <AnimationFrame
      title="Turn, cut, repeat (seen from above)"
      description="Seen from above, the plant stands on a turntable with two side shoots; the arm reaches in from the front. The first shoot points away, so the robot holds the clockwise button until the shoot faces the arm, lets go, and cuts it. The second shoot is now the other way, so it holds the counter-clockwise button, the shorter way round, lets go when the shoot faces the arm, and cuts it. The flower in the middle is never touched."
      steps={[
        "From above: two side shoots, neither facing the arm, which reaches in from the front.",
        "It holds the button that turns the shoot the short way, and lets go when it faces the arm.",
        "Then it reaches in and cuts the shoot off.",
        "The next shoot is round the other way, so it holds the other button.",
        "Cut again. Every shoot gone, the flower untouched: pruned.",
      ]}
      size={[480, 330]}
      hold={[2400, 2800, 2200, 2800, 3600]}
    >
      {(step) => {
        const turn = TURN[step];
        return (
          <>
            {/* The stand turns with everything on it */}
            <Move x={CX} y={CY} rotate={turn === 0 ? 0.01 : turn}>
              <circle r={STAND} className="t-muted a-fill-soft a-stroke" strokeWidth={2} />
              {TICKS.map((a, i) => (
                <line
                  key={i}
                  x1={Math.round(Math.cos(a) * (STAND - 12) * 10) / 10}
                  y1={Math.round(Math.sin(a) * (STAND - 12) * 10) / 10}
                  x2={Math.round(Math.cos(a) * (STAND - 4) * 10) / 10}
                  y2={Math.round(Math.sin(a) * (STAND - 4) * 10) / 10}
                  className="t-faint a-stroke"
                  strokeWidth={2}
                />
              ))}
              <circle r={30} className="t-muted a-fill-surface a-stroke" strokeWidth={2} />
              {SHOOTS.map((angle, i) => {
                const [x1, y1] = polar(angle, 22);
                const [x2, y2] = polar(angle, 70);
                const gone = CUT[step] > i;
                return (
                  <g key={angle} className="a-t t-accent" style={{ opacity: gone ? 0 : 1, transitionDelay: gone ? "300ms" : undefined }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} className="a-stroke" strokeWidth={4} strokeLinecap="round" />
                    <circle cx={x2} cy={y2} r={8} className="a-fill-soft a-stroke" strokeWidth={1.5} />
                  </g>
                );
              })}
            </Move>
            {/* The flower in the middle, seen from above */}
            <circle cx={CX} cy={CY} r={13} className="t-mark a-fill-soft a-stroke" strokeWidth={2} />
            <circle cx={CX} cy={CY} r={5} className="t-mark a-fill" />

            {/* The hand */}
            <Move x={CX} y={REACH[step] ? 238 : 312}>
              <Gripper x={0} y={0} angle={180} open={REACH[step] ? 0 : 1} tone="ink" size={0.9} />
            </Move>
            <Label x={CX + 34} y={300} tone="muted" size={14} anchor="start">
              arm
            </Label>

            {/* The two buttons */}
            <Label x={66} y={262} tone="muted" size={14}>
              buttons
            </Label>
            <Chip x={44} y={296} text="↺" mono={false} tone={BUTTON[step] === -1 ? "accent" : "muted"} variant={BUTTON[step] === -1 ? "solid" : "soft"} size={16} />
            <Chip x={88} y={296} text="↻" mono={false} tone={BUTTON[step] === 1 ? "accent" : "muted"} variant={BUTTON[step] === 1 ? "solid" : "soft"} size={16} />
            <Label x={66} y={232} tone="accent" size={14} weight={700} opacity={BUTTON[step] !== 0 ? 1 : 0}>
              held
            </Label>

            <Label x={468} y={24} tone={CUT[step] === 2 ? "success" : "ink"} size={14} weight={700} anchor="end">
              {CUT[step] === 2 ? "pruned ✓" : `shoots cut: ${CUT[step]} of 2`}
            </Label>
          </>
        );
      }}
    </AnimationFrame>
  );
}

