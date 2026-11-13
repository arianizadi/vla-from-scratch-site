"use client";

import { AnimationFrame, Label, Move, Path } from "@/animations";

/* Twelve demonstrations as small cards seen from above: where the arm starts
   (a dot), the object (a ring), and the arm's path. A sketch: the positions
   are made up; the share of recoveries, about a third, is the real one. */

const COLS = 4;
const W = 100;
const H = 70;
const GAP_X = 14;
const GAP_Y = 16;
const LEFT = (480 - (COLS * W + (COLS - 1) * GAP_X)) / 2;
const TOP = 26;

const HOME: [number, number] = [-36, -22];
const OBJECTS: [number, number][] = [
  [20, 10], [-5, 15], [25, -8], [10, 16], [-8, 6], [28, 12], [6, -6], [-20, 14], [22, 2], [0, 12], [16, -12], [-14, -4],
];
const STARTS: [number, number][] = [
  [-36, 20], [32, -22], [-34, -4], [36, 22], [-38, 22], [-32, -24], [38, 20], [30, -20], [-36, 10], [-26, -24], [36, 24], [32, 24],
];
/** The demonstrations in which the object is moved and the teacher recovers, and where the object goes. */
const RECOVER: Record<number, [number, number]> = { 1: [32, 16], 4: [22, -18], 6: [-28, 16], 10: [-26, 16] };

const centre = (i: number): [number, number] => [LEFT + W / 2 + (i % COLS) * (W + GAP_X), TOP + H / 2 + Math.floor(i / COLS) * (H + GAP_Y)];
const line = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

export function DataMix() {
  return (
    <AnimationFrame
      title="Demonstrations that go wrong on purpose"
      description="Twelve demonstrations drawn as small cards from above. At first every one starts from the same home pose and goes straight to the object, so the arm's first move gives the goal away. Then each starts from a random pose. Then in about a third of them the object is moved partway and the teacher turns toward its new place: these show the robot how to recover."
      steps={[
        "Plain demonstrations: the arm starts from home and goes straight to the object.",
        "Random start poses: the arm's first move no longer gives the goal away.",
        "In about a third, the object is moved and the teacher turns after it.",
        "Now the examples show how to recover, not only how to reach.",
      ]}
      size={[480, 302]}
      hold={[2600, 2600, 2800, 3400]}
    >
      {(step) => (
        <>
          {OBJECTS.map((object, i) => {
            const [cx, cy] = centre(i);
            const moved = RECOVER[i];
            const recovering = moved !== undefined && step >= 2;
            const start = step >= 1 ? STARTS[i] : HOME;
            const turn = mid(STARTS[i], object);
            return (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <rect
                  x={-W / 2}
                  y={-H / 2}
                  width={W}
                  height={H}
                  rx={10}
                  className={`a-t ${recovering ? "t-mark" : "t-faint"} a-fill-surface a-stroke`}
                  strokeWidth={recovering ? 2.5 : 1.5}
                />
                <Path d={line(HOME, object)} tone="muted" width={2} drawn={step === 0} />
                <Path d={line(STARTS[i], object)} tone="muted" width={2} drawn={step >= 1 && !recovering} />
                {moved ? (
                  <>
                    <Path d={line(STARTS[i], turn)} tone="action" width={2.5} drawn={recovering} />
                    <Path d={line(turn, moved)} tone="action" width={2.5} drawn={recovering} delay={300} />
                    <Move x={object[0]} y={object[1]} opacity={recovering ? 1 : 0}>
                      <circle r={6} fill="none" className="t-muted a-stroke" strokeWidth={1.5} strokeDasharray="3 3" />
                    </Move>
                  </>
                ) : null}
                <Move x={recovering ? moved[0] : object[0]} y={recovering ? moved[1] : object[1]}>
                  <circle r={6} className="t-action a-fill-soft a-stroke" strokeWidth={2} />
                </Move>
                <Move x={start[0]} y={start[1]} delay={i * 30}>
                  <circle r={4} className="t-ink a-fill" />
                </Move>
              </g>
            );
          })}
          <Label x={240} y={TOP + 3 * H + 2 * GAP_Y + 16} tone="muted" size={13} opacity={step >= 2 ? 0 : 1}>
            one card = one recorded demonstration, seen from above
          </Label>
          <Label x={240} y={TOP + 3 * H + 2 * GAP_Y + 16} tone="ink" size={13} weight={700} opacity={step >= 2 ? 1 : 0}>
            highlighted: the object moves, the teacher recovers
          </Label>
        </>
      )}
    </AnimationFrame>
  );
}
